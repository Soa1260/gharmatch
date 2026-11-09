import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAX_LIVE_LISTINGS, REPORT_CATEGORIES, REPORT_SEVERITY } from "@/lib/domain";
import { label } from "@/lib/labels";
import { createTestDb, makeUser, validListing } from "@/test/testDb";
import type { Db } from "./db";
import { browseListings, createListing, setListingStatus, updateListing } from "./listings";
import { PostgresRateLimiter } from "./rateLimit";

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
});
afterAll(async () => close());

describe("who may post a home", () => {
  it("needs the declaration and a poster type to publish", async () => {
    const landlord = await makeUser(db, { isLandlord: true, phone: "9876543210" });
    await expect(createListing(db, limiter, landlord, { ...validListing, declareAuthorised: false })).rejects.toMatchObject({ code: "INVALID" });
    await expect(createListing(db, limiter, landlord, { ...validListing, declareAuthorised: undefined })).rejects.toMatchObject({ code: "INVALID" });
    await expect(createListing(db, limiter, landlord, { ...validListing, postedBy: undefined })).rejects.toThrow();
    await expect(createListing(db, limiter, landlord, { ...validListing, postedBy: "BROKER" })).rejects.toThrow();
    expect(await db.listing.count({ where: { ownerId: landlord.id } })).toBe(0);
  });

  it("saves who posted and when they declared, and shows the poster type publicly", async () => {
    const landlord = await makeUser(db, { isLandlord: true, phone: "9876543210" });
    const made = await createListing(db, limiter, landlord, { ...validListing, postedBy: "AGENT", title: "Agent posted 2 BHK in Bopal" });
    const row = await db.listing.findUnique({ where: { id: made.id }, select: { postedBy: true, authorisationDeclaredAt: true } });
    expect(row?.postedBy).toBe("AGENT");
    expect(row?.authorisationDeclaredAt).toBeInstanceOf(Date);
    const page = await browseListings(db, {});
    expect(page.items.find((l) => l.slug === made.slug)?.postedBy).toBe("AGENT");
  });

  it("does not ask again on edit once declared, but asks a home that never declared", async () => {
    const landlord = await makeUser(db, { isLandlord: true, phone: "9876543210" });
    const made = await createListing(db, limiter, landlord, validListing);
    await expect(updateListing(db, landlord, made.id, { ...validListing, declareAuthorised: false, postedBy: "CARETAKER" })).resolves.toBeTruthy();
    expect((await db.listing.findUnique({ where: { id: made.id }, select: { postedBy: true } }))?.postedBy).toBe("CARETAKER");

    await db.listing.update({ where: { id: made.id }, data: { authorisationDeclaredAt: null } });
    await expect(updateListing(db, landlord, made.id, { ...validListing, declareAuthorised: false })).rejects.toMatchObject({ code: "INVALID" });
    await expect(updateListing(db, landlord, made.id, validListing)).resolves.toBeTruthy();
    expect((await db.listing.findUnique({ where: { id: made.id }, select: { authorisationDeclaredAt: true } }))?.authorisationDeclaredAt).toBeInstanceOf(Date);
  });
});

describe("the cap on live homes", () => {
  it("stops a sixth home, ignores deleted and expired ones, and cannot be sidestepped by reactivating", async () => {
    const landlord = await makeUser(db, { isLandlord: true, phone: "9876543210" });
    const ids: string[] = [];
    const at = (i: number) => ids[i] as string;
    for (let i = 0; i < MAX_LIVE_LISTINGS; i++) {
      ids.push((await createListing(db, limiter, landlord, { ...validListing, title: `Home number ${i} near Bopal` })).id);
    }
    await expect(createListing(db, limiter, landlord, { ...validListing, title: "One home too many near Bopal" })).rejects.toMatchObject({ code: "FORBIDDEN" });

    // Pausing still counts. Deleting frees a place.
    await setListingStatus(db, landlord, at(0), "PAUSED");
    await expect(createListing(db, limiter, landlord, { ...validListing, title: "Still too many near Bopal" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await setListingStatus(db, landlord, at(0), "DELETED");

    // An expired home does not count, but bringing it back does. The daily posting limit is also five, so the
    // fifth live home below is added straight into the database to set the scene.
    await db.listing.update({ where: { id: at(1) }, data: { status: "EXPIRED" } });
    const { id: _id, slug: _slug, createdAt: _c, updatedAt: _u, ...copy } = await db.listing.findUniqueOrThrow({ where: { id: at(2) } });
    void _id; void _c; void _u;
    await db.listing.create({ data: { ...copy, slug: `${_slug}-extra-a`, title: "Fourth live home near Bopal" } });
    await db.listing.create({ data: { ...copy, slug: `${_slug}-extra-b`, title: "Fifth live home near Bopal" } });
    expect(await db.listing.count({ where: { ownerId: landlord.id, status: { in: ["ACTIVE", "PAUSED"] } } })).toBe(MAX_LIVE_LISTINGS);
    await expect(setListingStatus(db, landlord, at(1), "ACTIVE")).rejects.toMatchObject({ code: "FORBIDDEN" });
    // A home that is already live can still be confirmed as available.
    await expect(setListingStatus(db, landlord, at(2), "ACTIVE")).resolves.toBeUndefined();
  });

  it("lets a landlord with room confirm a home is still available", async () => {
    const landlord = await makeUser(db, { isLandlord: true, phone: "9876543210" });
    const first = await createListing(db, limiter, landlord, { ...validListing, title: "First home near Bopal" });
    await expect(setListingStatus(db, landlord, first.id, "ACTIVE")).resolves.toBeUndefined();
  });
});

describe("reporting a broker or fee", () => {
  it("has a label and a severity, and is not an instant hold", () => {
    expect(REPORT_CATEGORIES).toContain("BROKER_OR_FEE");
    expect(label.reportCategory.BROKER_OR_FEE).toBeTruthy();
    expect(REPORT_SEVERITY.BROKER_OR_FEE).toBe("MEDIUM");
  });
});
