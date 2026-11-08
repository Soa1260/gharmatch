import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { visitIcs } from "@/lib/ics";
import { createTestDb, makeUser, validListing, validRequirement } from "@/test/testDb";
import type { Db } from "./db";
import { respondToInterest, sendInterest } from "./interests";
import { createListing, setListingStatus } from "./listings";
import { PostgresRateLimiter } from "./rateLimit";
import { createRequirement } from "./requirements";
import { cancelVisit, checkIn, checkOut, confirmVisit, getVisitForCalendar, listVisits, proposeVisit } from "./visits";

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
});
afterAll(async () => close());

const soon = (hours: number) => new Date(Date.now() + hours * 3_600_000);

async function accepted(group: "MEN" | "WOMEN" = "MEN") {
  const landlord = await makeUser(db, { isLandlord: true });
  const tenant = await makeUser(db, { isTenant: true, name: "Zoya Qureshi" });
  const listing = await createListing(db, limiter, landlord, validListing);
  const req = await createRequirement(db, limiter, tenant, { ...validRequirement, occupantGroup: group, tenantType: group === "WOMEN" ? "WORKING_WOMEN" : "BACHELORS" });
  const interest = await sendInterest(db, limiter, tenant, listing.id, req.id, { message: "Hello, I like this home." });
  await respondToInterest(db, landlord, interest.id, "ACCEPT");
  return { landlord, tenant, listing, interest };
}

describe("visit workflow", () => {
  it("needs an accepted interest, and only the visitor proposes", async () => {
    const landlord = await makeUser(db, { isLandlord: true });
    const tenant = await makeUser(db, { isTenant: true });
    const listing = await createListing(db, limiter, landlord, validListing);
    const req = await createRequirement(db, limiter, tenant, validRequirement);
    const pending = await sendInterest(db, limiter, tenant, listing.id, req.id, { message: "Hello, I like this home." });
    await expect(proposeVisit(db, tenant, pending.id, { scheduledAt: soon(24) })).rejects.toMatchObject({ code: "FORBIDDEN" });

    const a = await accepted();
    await expect(proposeVisit(db, a.landlord, a.interest.id, { scheduledAt: soon(24) })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const stranger = await makeUser(db, { isTenant: true });
    await expect(proposeVisit(db, stranger, a.interest.id, { scheduledAt: soon(24) })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(0.2) })).rejects.toMatchObject({ code: "INVALID" });
  });

  it("goes request, confirm with a named representative, check in, check out", async () => {
    const a = await accepted();
    const v = await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(3), companion: true });
    await expect(confirmVisit(db, a.landlord, v.id, { representativeName: "A", representativeRole: "OWNER" })).rejects.toThrow();
    await expect(confirmVisit(db, a.tenant, v.id, { representativeName: "Meera Shah", representativeRole: "OWNER" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(checkIn(db, a.tenant, v.id)).rejects.toBeTruthy();

    await confirmVisit(db, a.landlord, v.id, { representativeName: "Meera Joshi", representativeRole: "FAMILY_MEMBER" });
    await db.visit.update({ where: { id: v.id }, data: { scheduledAt: soon(0.5) } });
    await expect(checkIn(db, a.landlord, v.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await checkIn(db, a.tenant, v.id);
    await expect(checkIn(db, a.tenant, v.id)).rejects.toMatchObject({ code: "CONFLICT" });
    await checkOut(db, a.tenant, v.id);
    const row = await db.visit.findUniqueOrThrow({ where: { id: v.id } });
    expect(row.status).toBe("CHECKED_OUT");
    expect(row.checkedInAt).not.toBeNull();
    expect(row.checkedOutAt).not.toBeNull();
  });

  it("refuses check-in far from the visit time", async () => {
    const a = await accepted();
    const v = await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(48) });
    await confirmVisit(db, a.landlord, v.id, { representativeName: "Meera Joshi", representativeRole: "OWNER" });
    // The person is told when check-in opens, not left with a button that seems to do nothing.
    await expect(checkIn(db, a.tenant, v.id)).rejects.toMatchObject({ code: "INVALID", message: expect.stringContaining("2 hours before") });
  });

  it("lets the visitor check in once the window opens, two hours before", async () => {
    const a = await accepted();
    const v = await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(1.5) });
    await confirmVisit(db, a.landlord, v.id, { representativeName: "Meera Joshi", representativeRole: "OWNER" });
    await expect(checkIn(db, a.tenant, v.id)).resolves.toBeUndefined();
  });

  it("cancels waiting and confirmed visits when the landlord deletes the home", async () => {
    const a = await accepted();
    const waiting = await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(24) });
    const confirmed = await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(48) });
    await confirmVisit(db, a.landlord, confirmed.id, { representativeName: "Meera Joshi", representativeRole: "OWNER" });

    await setListingStatus(db, a.landlord, a.listing.id, "DELETED");

    const statuses = (await listVisits(db, a.tenant)).filter((v) => [waiting.id, confirmed.id].includes(v.id)).map((v) => v.status);
    expect(statuses).toEqual(["CANCELLED", "CANCELLED"]);
    // Pausing a home is not deleting it: visits already arranged stay.
    const b = await accepted();
    const kept = await proposeVisit(db, b.tenant, b.interest.id, { scheduledAt: soon(24) });
    await setListingStatus(db, b.landlord, b.listing.id, "PAUSED");
    expect((await listVisits(db, b.tenant)).find((v) => v.id === kept.id)?.status).toBe("REQUESTED");
  });

  it("lets either side cancel, and nobody else touch it", async () => {
    const a = await accepted();
    const v = await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(24) });
    const stranger = await makeUser(db, { isLandlord: true, isTenant: true });
    await expect(cancelVisit(db, stranger, v.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await cancelVisit(db, a.landlord, v.id);
    await expect(cancelVisit(db, a.tenant, v.id)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("shows owners a woman visitor only as Verified tenant", async () => {
    const a = await accepted("WOMEN");
    await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(24) });
    const forOwner = await listVisits(db, a.landlord);
    expect(forOwner[0]?.visitor).toBe("Verified tenant");
    expect(JSON.stringify(forOwner)).not.toContain("Zoya");
    const forTenant = await listVisits(db, a.tenant);
    expect(forTenant[0]?.visitor).toBe("You");
  });

  it("gives the calendar file only to the two parties, with the area and not the address", async () => {
    const a = await accepted();
    const v = await proposeVisit(db, a.tenant, a.interest.id, { scheduledAt: soon(24) });
    const stranger = await makeUser(db, { isTenant: true });
    await expect(getVisitForCalendar(db, stranger, v.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const data = await getVisitForCalendar(db, a.tenant, v.id);
    const ics = visitIcs({ id: data.id, start: data.scheduledAt, title: data.listing.title, area: data.listing.area, representative: data.representativeName });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("LOCATION:Bopal");
    expect(ics).not.toContain("Sunrise Heights");
  });
});
