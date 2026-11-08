import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { profileSchema } from "@/lib/schemas";
import { createTestDb, makeUser, validListing, validRequirement } from "@/test/testDb";
import { getContactsForInterest } from "./contacts";
import type { Db } from "./db";
import { inviteTenant, listMyInterests, respondToInterest, sendInterest, withdrawInterest } from "./interests";
import { browseListings, createListing, getPublicListing, setListingStatus, updateListing } from "./listings";
import { PostgresRateLimiter } from "./rateLimit";
import { createRequirement, listBoard } from "./requirements";

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
});
afterAll(async () => close());

const hello = { message: "Hello, I like this home." };

async function setup(opts: { group?: "MEN" | "WOMEN" | "MIXED"; landlordPhone?: string | null; tenantName?: string } = {}) {
  const landlord = await makeUser(db, { isLandlord: true, name: "Landlord One", phone: opts.landlordPhone === null ? undefined : opts.landlordPhone });
  const tenant = await makeUser(db, { isTenant: true, name: opts.tenantName ?? "Asha Rao" });
  const listing = await createListing(db, limiter, landlord, validListing);
  // Posting needs a number, so "no phone on file" means it was removed after the home went live.
  if (opts.landlordPhone === null) await db.user.update({ where: { id: landlord.id }, data: { phone: null } });
  const requirement = await createRequirement(db, limiter, tenant, { ...validRequirement, occupantGroup: opts.group ?? "MEN" });
  return { landlord, tenant, listing, requirement };
}

describe("ownership (no IDOR)", () => {
  it("stops another user from editing, pausing or deleting a listing", async () => {
    const { listing } = await setup();
    const stranger = await makeUser(db, { isLandlord: true });
    await expect(updateListing(db, stranger, listing.id, validListing)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(setListingStatus(db, stranger, listing.id, "PAUSED")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(setListingStatus(db, stranger, listing.id, "DELETED")).rejects.toMatchObject({ code: "NOT_FOUND" });
    const still = await db.listing.findUnique({ where: { id: listing.id }, select: { status: true } });
    expect(still?.status).toBe("ACTIVE");
  });

  it("rejects unauthenticated and banned users", async () => {
    await expect(createListing(db, limiter, null, validListing)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    const banned = await makeUser(db, { isLandlord: true, status: "BANNED" });
    await expect(createListing(db, limiter, banned, validListing)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("stops a user sending interest from someone else's search", async () => {
    const { listing, requirement } = await setup();
    const other = await makeUser(db, { isTenant: true });
    await expect(sendInterest(db, limiter, other, listing.id, requirement.id, hello)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("lets only the recipient answer, and only the sender withdraw", async () => {
    const { landlord, tenant, listing, requirement } = await setup();
    const interest = await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    const stranger = await makeUser(db, { isLandlord: true, isTenant: true });
    await expect(respondToInterest(db, stranger, interest.id, "ACCEPT")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(respondToInterest(db, tenant, interest.id, "ACCEPT")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(withdrawInterest(db, landlord, interest.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await respondToInterest(db, landlord, interest.id, "DECLINE");
    await expect(respondToInterest(db, landlord, interest.id, "ACCEPT")).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("contact reveal", () => {
  it("hides contacts until accepted, then shows each side the other", async () => {
    const { landlord, tenant, listing, requirement } = await setup();
    const interest = await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);

    await expect(getContactsForInterest(db, landlord, interest.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(getContactsForInterest(db, tenant, interest.id)).rejects.toMatchObject({ code: "FORBIDDEN" });

    await respondToInterest(db, landlord, interest.id, "ACCEPT");
    const forLandlord = await getContactsForInterest(db, landlord, interest.id);
    const forTenant = await getContactsForInterest(db, tenant, interest.id);
    expect(forLandlord.phone).toBe("9876543210");
    expect(forLandlord.email).toContain("@example.test");
    expect(forLandlord.name).toBe("Asha Rao");
    expect(forTenant.name).toBe("Landlord One");
  });

  it("does not reveal anything to a non-party, even after acceptance", async () => {
    const { landlord, tenant, listing, requirement } = await setup();
    const interest = await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    await respondToInterest(db, landlord, interest.id, "ACCEPT");
    const stranger = await makeUser(db, { isLandlord: true, isTenant: true });
    await expect(getContactsForInterest(db, stranger, interest.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getContactsForInterest(db, null, interest.id)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("does not reveal after a decline or a block", async () => {
    const a = await setup();
    const declined = await sendInterest(db, limiter, a.tenant, a.listing.id, a.requirement.id, hello);
    await respondToInterest(db, a.landlord, declined.id, "DECLINE");
    await expect(getContactsForInterest(db, a.landlord, declined.id)).rejects.toMatchObject({ code: "FORBIDDEN" });

    const b = await setup();
    const accepted = await sendInterest(db, limiter, b.tenant, b.listing.id, b.requirement.id, hello);
    await respondToInterest(db, b.landlord, accepted.id, "ACCEPT");
    await db.block.create({ data: { blockerId: b.tenant.id, blockedId: b.landlord.id } });
    await expect(getContactsForInterest(db, b.landlord, accepted.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("never puts email or phone in listings, interests or the board", async () => {
    const { landlord, tenant, listing, requirement } = await setup();
    await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    const row = await db.listing.findUniqueOrThrow({ where: { id: listing.id }, select: { slug: true } });
    const sources = [
      await browseListings(db, {}),
      await getPublicListing(db, row.slug),
      await listMyInterests(db, landlord, "received"),
      await listBoard(db, landlord, {}),
    ];
    const text = JSON.stringify(sources);
    expect(text).not.toContain("9876543210");
    expect(text).not.toContain("@example.test");
  });
});

describe("women's safety", () => {
  it("hides name and intro of women on the board and in received interests", async () => {
    const { landlord, tenant, listing, requirement } = await setup({ group: "WOMEN", tenantName: "Zoya Qureshi" });
    await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    const board = await listBoard(db, landlord, {});
    const received = await listMyInterests(db, landlord, "received");
    const womenRows = [
      ...board.items.filter((i) => i.group === "WOMEN"),
      ...received.map((r) => r.tenant).filter((t) => t.group === "WOMEN"),
    ];
    expect(womenRows.length).toBeGreaterThan(0);
    for (const row of womenRows) {
      expect(row.intro).toBeNull();
      expect(row.displayName).toBe("Verified tenant");
    }
    expect(JSON.stringify([board, received])).not.toContain("Zoya");
  });

  it("blocks a men's search from a women-only home, even with acknowledgement", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const listing = await createListing(db, limiter, landlord, { ...validListing, genderPolicy: "WOMEN_ONLY" });
    const tenant = await makeUser(db, { isTenant: true });
    const req = await createRequirement(db, limiter, tenant, validRequirement);
    await expect(
      sendInterest(db, limiter, tenant, listing.id, req.id, { ...hello, acknowledgeConflicts: true }),
    ).rejects.toMatchObject({ code: "INVALID" });
  });

  it("requires a phone on file before a landlord invites a woman", async () => {
    const { landlord, requirement, listing } = await setup({ group: "WOMEN", landlordPhone: null });
    await expect(
      inviteTenant(db, limiter, landlord, listing.id, requirement.id, { message: "Your search fits this home." }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("refuses to publish or edit a home for a landlord with no phone on file", async () => {
    const noPhone = await makeUser(db, { isLandlord: true, phone: null });
    await expect(createListing(db, limiter, noPhone, validListing)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const { landlord, listing } = await setup();
    await db.user.update({ where: { id: landlord.id }, data: { phone: null } });
    await expect(updateListing(db, landlord, listing.id, validListing)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requires a mobile number in the profile of anyone who rents out a home", () => {
    const base = { name: "Ravi", isTenant: false };
    expect(profileSchema.safeParse({ ...base, isLandlord: true }).success).toBe(false);
    expect(profileSchema.safeParse({ ...base, isLandlord: true, phone: "9876543210" }).success).toBe(true);
    expect(profileSchema.safeParse({ name: "Asha", isLandlord: false, isTenant: true }).success).toBe(true);
  });

  it("lets a landlord with a phone invite, and only the tenant accept to reveal contacts", async () => {
    const { landlord, tenant, requirement, listing } = await setup({ group: "WOMEN" });
    const invite = await inviteTenant(db, limiter, landlord, listing.id, requirement.id, { message: "Your search fits this home." });
    await expect(respondToInterest(db, landlord, invite.id, "ACCEPT")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await respondToInterest(db, tenant, invite.id, "ACCEPT");
    expect((await getContactsForInterest(db, tenant, invite.id)).name).toBe("Landlord One");
  });

  it("refuses phone numbers in interest messages", async () => {
    const { tenant, listing, requirement } = await setup();
    await expect(
      sendInterest(db, limiter, tenant, listing.id, requirement.id, { message: "Call me on 98765 43210 please" }),
    ).rejects.toThrow();
  });
});

describe("guards and limits", () => {
  it("rejects listings that use religion or caste as a condition", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    await expect(
      createListing(db, limiter, landlord, { ...validListing, description: "Only Hindu family, no non-veg in kitchen." }),
    ).rejects.toThrow();
  });

  it("holds back a listing that mentions a surname until it is reviewed", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const l = await createListing(db, limiter, landlord, {
      ...validListing,
      description: "Near Patel Colony bus stop, quiet lane with parking.",
    });
    expect(await getPublicListing(db, l.slug)).toBeNull();
  });

  it("limits listing creation per day", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    for (let i = 0; i < 5; i++) await createListing(db, limiter, landlord, validListing);
    await expect(createListing(db, limiter, landlord, validListing)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("allows only one interest per home and search", async () => {
    const { tenant, listing, requirement } = await setup();
    await sendInterest(db, limiter, tenant, listing.id, requirement.id, hello);
    await expect(
      sendInterest(db, limiter, tenant, listing.id, requirement.id, { message: "Hello again, still keen." }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("returns at most one page of public listings", async () => {
    const page = await browseListings(db, {});
    expect(page.items.length).toBeLessThanOrEqual(12);
  });
});
