import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, makeUser, validListing } from "@/test/testDb";
import { fileReport } from "./account";
import type { Db } from "./db";
import { decideAppeal, fileAppeal, listAppealable, resolveReport, startReview } from "./incidents";
import { createListing, getPublicListing } from "./listings";
import type { Notifier } from "./notify";
import { PostgresRateLimiter } from "./rateLimit";
import { recordInspection, setIdentityChecked, setOwnershipReviewed } from "./verification";

class Recorder implements Notifier {
  sent: Array<{ to: string; subject: string; text: string }> = [];
  async send(to: string, subject: string, text: string) {
    this.sent.push({ to, subject, text });
  }
}

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;
let admin: { id: string };
let admins: string[];

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
  admin = await makeUser(db);
  const row = await db.user.findUniqueOrThrow({ where: { id: admin.id }, select: { email: true } });
  admins = [row.email];
});
afterAll(async () => close());

async function listed() {
  const landlord = await makeUser(db, { isLandlord: true });
  const listing = await createListing(db, limiter, landlord, validListing);
  return { landlord, listing };
}

describe("verification indicators", () => {
  it("are admin-only", async () => {
    const { landlord, listing } = await listed();
    await expect(setIdentityChecked(db, landlord, landlord.id, "PHOTO_ID_SEEN_IN_PERSON", admins)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(setOwnershipReviewed(db, landlord, listing.id, "UTILITY_BILL", admins)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(recordInspection(db, landlord, listing.id, { inspectedAt: new Date(), verifiedItems: [] }, admins)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(setIdentityChecked(db, null, landlord.id, "PHOTO_ID_SEEN_IN_PERSON", admins)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("keep identity, ownership and inspection separate, with dates and an audit trail", async () => {
    const { landlord, listing } = await listed();
    const before = await getPublicListing(db, listing.slug);
    expect(before?.owner.identityCheckedAt).toBeNull();
    expect(before?.ownershipReviewedAt).toBeNull();
    expect(before?.inspections).toEqual([]);

    await setIdentityChecked(db, admin, landlord.id, "PHOTO_ID_SEEN_IN_PERSON", admins);
    let now = await getPublicListing(db, listing.slug);
    expect(now?.owner.identityCheckedAt).not.toBeNull();
    expect(now?.ownershipReviewedAt).toBeNull();
    expect(now?.inspections).toEqual([]);

    await setOwnershipReviewed(db, admin, listing.id, "PROPERTY_TAX_RECEIPT", admins);
    await recordInspection(db, admin, listing.id, { inspectedAt: new Date(Date.now() - 86_400_000), verifiedItems: ["DOOR_LOCKS", "FIRE_SAFETY"], notes: "Checked in person" }, admins);
    now = await getPublicListing(db, listing.slug);
    expect(now?.ownershipDocType).toBe("PROPERTY_TAX_RECEIPT");
    expect(now?.inspections[0]?.verifiedItems).toEqual(["DOOR_LOCKS", "FIRE_SAFETY"]);

    const log = await db.auditLog.findMany({ where: { targetId: { in: [landlord.id, listing.id] } } });
    expect(log.map((l) => l.action).sort()).toEqual(["IDENTITY_CHECKED", "INSPECTION_RECORDED", "OWNERSHIP_REVIEWED"]);
  });

  it("rejects an unknown document type, an unknown item and a future inspection date", async () => {
    const { listing } = await listed();
    await expect(setOwnershipReviewed(db, admin, listing.id, "SELFIE", admins)).rejects.toThrow();
    await expect(recordInspection(db, admin, listing.id, { inspectedAt: new Date(), verifiedItems: ["LUCKY_CHARM"] }, admins)).rejects.toThrow();
    await expect(recordInspection(db, admin, listing.id, { inspectedAt: new Date(Date.now() + 30 * 86_400_000), verifiedItems: [] }, admins)).rejects.toThrow();
  });
});

describe("incident handling", () => {
  it("holds immediately for severe categories and records severity", async () => {
    const { listing } = await listed();
    const reporter = await makeUser(db, { isTenant: true });
    await fileReport(db, limiter, reporter, { targetType: "LISTING", targetId: listing.id, category: "UNAUTHORIZED_ENTRY", incidentAt: new Date(Date.now() - 3600_000) });
    const r = await db.report.findFirstOrThrow({ where: { reporterId: reporter.id } });
    expect(r).toMatchObject({ severity: "CRITICAL", urgent: true });
    expect(r.incidentAt).not.toBeNull();
    expect((await db.listing.findUniqueOrThrow({ where: { id: listing.id } })).status).toBe("PAUSED");
  });

  it("does not auto-hold for a reporter whose recent reports were mostly dismissed", async () => {
    const { listing } = await listed();
    const serial = await makeUser(db, { isTenant: true });
    for (let i = 0; i < 3; i++) {
      const other = await listed();
      await fileReport(db, limiter, serial, { targetType: "LISTING", targetId: other.listing.id, category: "OTHER" });
    }
    await db.report.updateMany({ where: { reporterId: serial.id }, data: { status: "DISMISSED" } });
    await fileReport(db, limiter, serial, { targetType: "LISTING", targetId: listing.id, category: "LANDLORD_HARASSMENT" });
    expect((await db.listing.findUniqueOrThrow({ where: { id: listing.id } })).status).toBe("ACTIVE");
    expect(await db.report.count({ where: { targetId: listing.id } })).toBe(1);
  });

  it("walks a report through review and decision, notifying the reporter without details", async () => {
    const { listing } = await listed();
    const reporter = await makeUser(db, { isTenant: true });
    const notifier = new Recorder();
    await fileReport(db, limiter, reporter, { targetType: "LISTING", targetId: listing.id, category: "OCCUPANCY_VIOLATION", details: "Private details" });
    const report = await db.report.findFirstOrThrow({ where: { reporterId: reporter.id } });

    await expect(startReview(db, notifier, reporter, report.id, admins)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await startReview(db, notifier, admin, report.id, admins);
    expect((await db.report.findUniqueOrThrow({ where: { id: report.id } })).status).toBe("UNDER_REVIEW");
    await resolveReport(db, notifier, admin, report.id, { outcome: "ACTION", note: "Confirmed with the building" }, admins);

    const done = await db.report.findUniqueOrThrow({ where: { id: report.id } });
    expect(done).toMatchObject({ status: "ACTIONED", resolutionNote: "Confirmed with the building" });
    expect(done.resolvedAt).not.toBeNull();
    expect(notifier.sent.length).toBe(2);
    expect(JSON.stringify(notifier.sent)).not.toContain("Private details");
    await expect(resolveReport(db, notifier, admin, report.id, { outcome: "DISMISS", note: "again" }, admins)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("lets the owner appeal a hold, and an upheld appeal lifts it", async () => {
    const { landlord, listing } = await listed();
    const reporter = await makeUser(db, { isTenant: true });
    const stranger = await makeUser(db, { isLandlord: true });
    const notifier = new Recorder();
    await fileReport(db, limiter, reporter, { targetType: "LISTING", targetId: listing.id, category: "PROPERTY_SAFETY_VIOLATION" });
    const report = await db.report.findFirstOrThrow({ where: { reporterId: reporter.id } });

    const visible = await listAppealable(db, landlord);
    expect(visible[0]).toMatchObject({ id: report.id, category: "PROPERTY_SAFETY_VIOLATION" });
    expect(JSON.stringify(visible)).not.toContain(reporter.id);
    expect(await listAppealable(db, stranger)).toEqual([]);

    await expect(fileAppeal(db, stranger, { reportId: report.id, message: "This is not mine to appeal" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await fileAppeal(db, landlord, { reportId: report.id, message: "The lock was replaced last week." });
    await expect(fileAppeal(db, landlord, { reportId: report.id, message: "Trying again right now" })).rejects.toMatchObject({ code: "CONFLICT" });

    const appeal = await db.appeal.findFirstOrThrow({ where: { reportId: report.id } });
    await expect(decideAppeal(db, notifier, landlord, appeal.id, { outcome: "UPHELD", note: "ok" }, admins)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await decideAppeal(db, notifier, admin, appeal.id, { outcome: "UPHELD", note: "Photo of new lock seen" }, admins);

    expect((await db.listing.findUniqueOrThrow({ where: { id: listing.id } })).flagged).toBe(false);
    expect((await db.report.findUniqueOrThrow({ where: { id: report.id } })).status).toBe("DISMISSED");
    expect(notifier.sent.some((m) => m.subject.includes("appeal"))).toBe(true);
  });
});
