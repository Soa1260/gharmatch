import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { asksForMoney, scamSignals, visitShareText } from "@/lib/safety";
import { createTestDb, makeUser, validListing, validRequirement } from "@/test/testDb";
import { fileReport, saveTrustedContact } from "./account";
import type { Db } from "./db";
import { inviteTenant, sendInterest } from "./interests";
import { createListing } from "./listings";
import { PostgresRateLimiter } from "./rateLimit";
import { createRequirement } from "./requirements";

describe("scam wording", () => {
  it("refuses payment talk and flags classic scam stories", () => {
    expect(asksForMoney("Please send the token amount on gpay")).toBe(true);
    expect(asksForMoney("Share your bank account number")).toBe(true);
    expect(asksForMoney("I can visit on Saturday at 11. Is parking free?")).toBe(false);
    expect(scamSignals("I am in the army posted abroad, send advance and I will courier the keys").length).toBeGreaterThan(0);
    expect(scamSignals("No need to visit, pay token now").length).toBeGreaterThan(0);
    expect(scamSignals("Second floor flat with lift and covered parking. Deposit is two months.")).toEqual([]);
  });

  it("builds a visit message without contact details", () => {
    const t = visitShareText({ title: "2 BHK", area: "Bopal", url: "https://x.test/listings/a", when: "5 pm" });
    expect(t).toContain("Bopal");
    expect(t).toContain("5 pm");
  });
});

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
});
afterAll(async () => close());


describe("reports protect people straight away", () => {
  it("pauses a listing at once for a safety report and keeps a frozen copy", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const reporter = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    await fileReport(db, limiter, reporter, { targetType: "LISTING", targetId: listing.id, category: "LANDLORD_HARASSMENT" });

    const row = await db.listing.findUniqueOrThrow({ where: { id: listing.id } });
    expect(row.status).toBe("PAUSED");
    expect(row.flagged).toBe(true);

    await db.listing.update({ where: { id: listing.id }, data: { title: "Edited after the report to hide it" } });
    const report = await db.report.findFirstOrThrow({ where: { reporterId: reporter.id } });
    const snap = JSON.parse(report.snapshot ?? "{}");
    expect(snap.listing.title).toBe(validListing.title);
    expect(snap.listing.ownerId).toBe(landlord.id);
    expect(report.snapshot).not.toContain("9876543210");
    expect(report.snapshot).not.toContain("@example.test");
  });

  it("pauses a listing once two different people report it for a lesser reason", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const a = await makeUser(db, { isTenant: true });
    const b = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    await fileReport(db, limiter, a, { targetType: "LISTING", targetId: listing.id, category: "OTHER" });
    expect((await db.listing.findUniqueOrThrow({ where: { id: listing.id } })).status).toBe("ACTIVE");
    await fileReport(db, limiter, b, { targetType: "LISTING", targetId: listing.id, category: "FINANCIAL_FRAUD" });
    expect((await db.listing.findUniqueOrThrow({ where: { id: listing.id } })).status).toBe("PAUSED");
  });

  it("accepts a need-help report as urgent", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const reporter = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    await fileReport(db, limiter, reporter, { targetType: "LISTING", targetId: listing.id, category: "NEED_HELP" });
    expect((await db.report.findFirstOrThrow({ where: { reporterId: reporter.id } })).urgent).toBe(true);
  });
});

describe("rules that protect women", () => {
  it("needs a phone number on file to post a women-only home", async () => {
    const noPhone = await makeUser(db, { isLandlord: true, phone: null });
    await expect(createListing(db, limiter, noPhone, { ...validListing, genderPolicy: "WOMEN_ONLY" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const withPhone = await makeUser(db, { isLandlord: true });
    await expect(createListing(db, limiter, withPhone, { ...validListing, genderPolicy: "WOMEN_ONLY" })).resolves.toBeTruthy();
  });

  it("stops a landlord with an upheld safety report from inviting women", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const woman = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    const req = await createRequirement(db, limiter, woman, { ...validRequirement, occupantGroup: "WOMEN", tenantType: "WORKING_WOMEN" });

    const reporter = await makeUser(db, { isTenant: true });
    await fileReport(db, limiter, reporter, { targetType: "USER", targetId: landlord.id, category: "LANDLORD_HARASSMENT" });
    await db.report.updateMany({ where: { targetId: landlord.id }, data: { status: "ACTIONED" } });

    await expect(inviteTenant(db, limiter, landlord, listing.id, req.id, { message: "Your search fits this home." }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses payment talk in interest messages", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const tenant = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    const req = await createRequirement(db, limiter, tenant, validRequirement);
    await expect(sendInterest(db, limiter, tenant, listing.id, req.id, { message: "Will pay the token amount on paytm today" })).rejects.toThrow();
  });
});

describe("trusted contact", () => {
  it("saves and validates a trusted contact", async () => {
    const user = await makeUser(db);
    await expect(saveTrustedContact(db, user, { name: "Mum", phone: "123" })).rejects.toThrow();
    await saveTrustedContact(db, user, { name: "Mum", phone: "9876500000" });
    const row = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { trustedContactName: true, trustedContactPhone: true } });
    expect(row).toEqual({ trustedContactName: "Mum", trustedContactPhone: "9876500000" });
  });
});
