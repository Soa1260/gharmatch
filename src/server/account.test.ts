import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, makeUser, validListing, validRequirement } from "@/test/testDb";
import { POLICY_VERSION } from "@/lib/legal";
import { blockUser, fileReport, saveProfile } from "./account";
import type { Db } from "./db";
import { sendInterest } from "./interests";
import { createListing } from "./listings";
import { PostgresRateLimiter } from "./rateLimit";
import { createRequirement } from "./requirements";

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
});
afterAll(async () => close());

describe("reports", () => {
  it("marks harassment reports urgent and refuses duplicates", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const reporter = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    const report = { targetType: "LISTING", targetId: listing.id, category: "LANDLORD_HARASSMENT" };
    await fileReport(db, limiter, reporter, report);
    const row = await db.report.findFirstOrThrow({ where: { reporterId: reporter.id } });
    expect(row.urgent).toBe(true);
    await expect(fileReport(db, limiter, reporter, report)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("does not accept a report about something that does not exist", async () => {
    const reporter = await makeUser(db, { isTenant: true });
    await expect(
      fileReport(db, limiter, reporter, { targetType: "LISTING", targetId: "nope", category: "OTHER" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("blocking", () => {
  it("withdraws pending interests between the two people", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const tenant = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    const req = await createRequirement(db, limiter, tenant, validRequirement);
    const interest = await sendInterest(db, limiter, tenant, listing.id, req.id, { message: "Hello, I like this home." });
    await blockUser(db, tenant, landlord.id);
    const after = await db.interest.findUniqueOrThrow({ where: { id: interest.id } });
    expect(after.status).toBe("WITHDRAWN");
    await expect(blockUser(db, tenant, tenant.id)).rejects.toMatchObject({ code: "INVALID" });
  });
});

describe("profile", () => {
  it("requires a role and a valid mobile number", async () => {
    const user = await makeUser(db);
    await expect(saveProfile(db, user, { name: "Ravi", isLandlord: false, isTenant: false })).rejects.toThrow();
    await expect(saveProfile(db, user, { name: "Ravi", phone: "12345", isLandlord: true, isTenant: false })).rejects.toThrow();
    await saveProfile(db, user, { name: "Ravi", phone: "9876543210", isLandlord: true, isTenant: false, acceptTerms: true });
    const saved = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { isLandlord: true, onboarded: true } });
    expect(saved).toEqual({ isLandlord: true, onboarded: true });
  });

  it("will not continue until the person agrees to the Terms, and records which version", async () => {
    const user = await makeUser(db);
    const profile = { name: "Asha", isLandlord: false, isTenant: true };
    await expect(saveProfile(db, user, profile)).rejects.toMatchObject({ code: "INVALID" });
    expect((await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { termsVersion: true } })).termsVersion).toBeNull();

    await saveProfile(db, user, { ...profile, acceptTerms: true });
    const after = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { termsVersion: true, termsAcceptedAt: true } });
    expect(after.termsVersion).toBe(POLICY_VERSION);
    expect(after.termsAcceptedAt).toBeInstanceOf(Date);

    // Already agreed to this version: editing the profile later does not ask again.
    await expect(saveProfile(db, user, { ...profile, name: "Asha R" })).resolves.toBeUndefined();

    // A new version of the documents asks again.
    await db.user.update({ where: { id: user.id }, data: { termsVersion: "older" } });
    await expect(saveProfile(db, user, profile)).rejects.toMatchObject({ code: "INVALID" });
  });
});
