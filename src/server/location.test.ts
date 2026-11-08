import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestDb, makeUser, validListing, validRequirement } from "@/test/testDb";
import { getLocationForInterest } from "./contacts";
import type { Db } from "./db";
import { respondToInterest, sendInterest } from "./interests";
import { browseListings, createListing, getApproxLocation, getPublicListing, updateListing } from "./listings";
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

describe("listing location", () => {
  it("refuses a link with no coordinates and a pin outside the city", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    await expect(createListing(db, limiter, landlord, { ...validListing, mapsLink: "near the big temple" })).rejects.toMatchObject({ code: "INVALID" });
    await expect(createListing(db, limiter, landlord, { ...validListing, mapsLink: "19.0760, 72.8777" })).rejects.toMatchObject({ code: "INVALID" });
  });

  it("holds a listing whose pin is far from the chosen area", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const l = await createListing(db, limiter, landlord, { ...validListing, mapsLink: "23.0700, 72.6500" });
    const row = await db.listing.findUniqueOrThrow({ where: { id: l.id } });
    expect(row.locationStatus).toBe("FAR_FROM_AREA");
    expect(row.flagged).toBe(true);
    expect(await getPublicListing(db, l.slug)).toBeNull();
  });

  it("stores a matching pin as checked and visible", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const l = await createListing(db, limiter, landlord, validListing);
    const row = await db.listing.findUniqueOrThrow({ where: { id: l.id } });
    expect(row.locationStatus).toBe("MATCHES_AREA");
    expect(row.locationCheckedAt).not.toBeNull();
    expect(await getPublicListing(db, l.slug)).not.toBeNull();
  });

  it("never exposes the exact pin or address publicly, only an approximate point", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const l = await createListing(db, limiter, landlord, validListing);
    const pub = await getPublicListing(db, l.slug);
    const approx = await getApproxLocation(db, l.id);
    const text = JSON.stringify([pub, approx, await browseListings(db, {})]);
    expect(text).not.toContain("23.0302");
    expect(text).not.toContain("72.4711");
    expect(text).not.toContain("Sunrise Heights");
    expect(approx).toEqual({ lat: 23.035, lng: 72.475 });
  });

  it("reveals the exact address only to the two parties of an accepted interest", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const tenant = await makeUser(db, { isTenant: true });
    const stranger = await makeUser(db, { isLandlord: true });
    const l = await createListing(db, limiter, landlord, validListing);
    const req = await createRequirement(db, limiter, tenant, validRequirement);
    const interest = await sendInterest(db, limiter, tenant, l.id, req.id, { message: "Hello, I like this home." });

    await expect(getLocationForInterest(db, tenant, interest.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await respondToInterest(db, landlord, interest.id, "ACCEPT");
    const loc = await getLocationForInterest(db, tenant, interest.id);
    expect(loc).toMatchObject({ lat: 23.0302, lng: 72.4711 });
    expect(loc.addressLine).toContain("Sunrise Heights");
    await expect(getLocationForInterest(db, stranger, interest.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getLocationForInterest(db, null, interest.id)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("does not let an edit lift a hold", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const l = await createListing(db, limiter, landlord, validListing);
    await db.listing.update({ where: { id: l.id }, data: { flagged: true, status: "PAUSED" } });
    await updateListing(db, landlord, l.id, validListing);
    expect((await db.listing.findUniqueOrThrow({ where: { id: l.id } })).flagged).toBe(true);
  });
});

describe("disclosure rules", () => {
  it("requires camera locations, access, and a no-private-spaces confirmation when CCTV is listed", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    await expect(createListing(db, limiter, landlord, { ...validListing, cctvLocations: undefined })).rejects.toThrow();
    await expect(createListing(db, limiter, landlord, { ...validListing, noPrivateCameras: false })).rejects.toThrow();
    await expect(createListing(db, limiter, landlord, { ...validListing, securityFeatures: ["ENTRANCE_SECURITY"], cctvLocations: undefined, cctvAccess: undefined, noPrivateCameras: false })).resolves.toBeTruthy();
  });

  it("requires reasonable notice before the owner enters", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    await expect(createListing(db, limiter, landlord, { ...validListing, ownerAccess: "WITH_NOTICE", noticeHours: 2 })).rejects.toThrow();
  });
});
