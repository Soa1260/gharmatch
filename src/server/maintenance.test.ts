import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, makeUser, validListing, validRequirement } from "@/test/testDb";
import { deleteAccount } from "./deletion";
import type { Db } from "./db";
import { getContactsForInterest } from "./contacts";
import { respondToInterest, sendInterest } from "./interests";
import { browseListings, createListing } from "./listings";
import { runDailyMaintenance } from "./maintenance";
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

describe("account deletion", () => {
  it("removes personal data, hides listings and cuts off contact reveal", async () => {
    const landlord = await makeUser(db, { isLandlord: true, name: "Gone Landlord" });
    const tenant = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    const req = await createRequirement(db, limiter, tenant, validRequirement);
    const interest = await sendInterest(db, limiter, tenant, listing.id, req.id, { message: "Hello, I like this home." });
    await respondToInterest(db, landlord, interest.id, "ACCEPT");

    await deleteAccount(db, landlord);

    const row = await db.user.findUniqueOrThrow({ where: { id: landlord.id }, select: { name: true, phone: true, status: true, deletedAt: true } });
    expect(row).toMatchObject({ name: null, phone: null, status: "DELETED" });
    expect(row.deletedAt).not.toBeNull();
    expect((await browseListings(db, {})).items.find((i) => i.slug === listing.slug)).toBeUndefined();
    await expect(getContactsForInterest(db, tenant, interest.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(createListing(db, limiter, landlord, validListing)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("daily maintenance", () => {
  it("expires old listings, purges old deleted accounts and clears stale counters", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    await db.listing.update({ where: { id: listing.id }, data: { expiresAt: new Date(Date.now() - 1000) } });

    const old = await makeUser(db);
    await db.user.update({ where: { id: old.id }, data: { status: "DELETED", deletedAt: new Date(Date.now() - 40 * 86_400_000) } });
    await db.rateLimit.create({ data: { key: "x", windowStart: new Date(Date.now() - 5 * 86_400_000), count: 1 } });

    const result = await runDailyMaintenance(db);
    expect(result.expiredListings).toBeGreaterThanOrEqual(1);
    expect(result.purgedAccounts).toBeGreaterThanOrEqual(1);
    expect(result.rateLimitRows).toBeGreaterThanOrEqual(1);
    expect((await db.listing.findUniqueOrThrow({ where: { id: listing.id } })).status).toBe("EXPIRED");
    expect(await db.user.findUnique({ where: { id: old.id } })).toBeNull();
  });
});
