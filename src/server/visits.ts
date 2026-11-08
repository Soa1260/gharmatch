import { z } from "zod";
import { toBoardView } from "@/lib/safety";
import { safeText } from "@/lib/schemas";
import { requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError } from "./errors";

const HOUR = 3_600_000;
const MAX_OPEN_PER_INTEREST = 3;
/** Check-in opens this long before the visit time and closes CHECK_IN_LATE_MS after it. */
export const CHECK_IN_EARLY_MS = 2 * HOUR;
export const CHECK_IN_LATE_MS = 6 * HOUR;

export const REPRESENTATIVE_ROLES = ["OWNER", "FAMILY_MEMBER", "AGENT", "CARETAKER"] as const;

const proposeSchema = z.object({
  scheduledAt: z.coerce.date(),
  companion: z.boolean().default(false),
  note: safeText(0, 200).optional(),
});

const confirmSchema = z.object({
  representativeName: z.string().trim().min(2, "Name the person who will meet the visitor.").max(60),
  representativeRole: z.enum(REPRESENTATIVE_ROLES),
});

async function partyOf(db: Db, userId: string, interestId: string) {
  const i = await db.interest.findUnique({
    where: { id: interestId },
    select: { id: true, status: true, listingId: true, listing: { select: { ownerId: true, status: true, flagged: true } }, requirement: { select: { tenantId: true } } },
  });
  const isParty = i && (i.listing.ownerId === userId || i.requirement.tenantId === userId);
  if (!i || !isParty) throw new AppError("NOT_FOUND", "Not found.");
  return { ...i, ownerId: i.listing.ownerId, tenantId: i.requirement.tenantId };
}

async function loadVisit(db: Db, userId: string, visitId: string) {
  const v = await db.visit.findUnique({
    where: { id: visitId },
    select: { id: true, status: true, scheduledAt: true, tenantId: true, listing: { select: { ownerId: true } } },
  });
  if (!v || (v.tenantId !== userId && v.listing.ownerId !== userId)) throw new AppError("NOT_FOUND", "Not found.");
  return { ...v, ownerId: v.listing.ownerId };
}

/** A visit can be planned only after the landlord has accepted, and only by the tenant. */
export async function proposeVisit(db: Db, actor: Actor | null, interestId: string, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  const input = proposeSchema.parse(raw);
  const i = await partyOf(db, user.id, interestId);
  if (i.status !== "ACCEPTED") throw new AppError("FORBIDDEN", "Visits can be planned after the interest is accepted.");
  if (i.tenantId !== user.id) throw new AppError("FORBIDDEN", "The person looking for a home proposes the visit.");
  // A home that was deleted, paused or put on hold cannot take new visits.
  if (i.listing.status !== "ACTIVE" || i.listing.flagged) throw new AppError("FORBIDDEN", "This home is not available for visits right now.");
  const now = Date.now();
  if (input.scheduledAt.getTime() < now + HOUR) throw new AppError("INVALID", "Choose a time at least an hour from now.");
  if (input.scheduledAt.getTime() > now + 60 * 86_400_000) throw new AppError("INVALID", "Choose a time within the next 60 days.");
  const open = await db.visit.count({ where: { interestId, status: { in: ["REQUESTED", "CONFIRMED"] } } });
  if (open >= MAX_OPEN_PER_INTEREST) throw new AppError("INVALID", "You already have visits planned for this home.");
  return db.visit.create({
    data: { interestId, listingId: i.listingId, tenantId: user.id, scheduledAt: input.scheduledAt, companion: input.companion, note: input.note || null },
    select: { id: true },
  });
}

/** The owner confirms and must name the person who will meet the visitor, so the visitor knows who to expect. */
export async function confirmVisit(db: Db, actor: Actor | null, visitId: string, raw: unknown) {
  const user = await requireActiveUser(db, actor);
  const input = confirmSchema.parse(raw);
  const v = await loadVisit(db, user.id, visitId);
  if (v.ownerId !== user.id) throw new AppError("FORBIDDEN", "Only the owner confirms a visit.");
  const res = await db.visit.updateMany({
    where: { id: visitId, status: "REQUESTED" },
    data: { status: "CONFIRMED", representativeName: input.representativeName, representativeRole: input.representativeRole },
  });
  if (res.count === 0) throw new AppError("CONFLICT", "That visit cannot be confirmed now.");
}

export async function cancelVisit(db: Db, actor: Actor | null, visitId: string) {
  const user = await requireActiveUser(db, actor);
  await loadVisit(db, user.id, visitId);
  const res = await db.visit.updateMany({ where: { id: visitId, status: { in: ["REQUESTED", "CONFIRMED"] } }, data: { status: "CANCELLED" } });
  if (res.count === 0) throw new AppError("CONFLICT", "That visit can no longer be cancelled.");
}

/** Arrival check-in. Only the visitor, only on the day, only for a confirmed visit. */
export async function checkIn(db: Db, actor: Actor | null, visitId: string) {
  const user = await requireActiveUser(db, actor);
  const v = await loadVisit(db, user.id, visitId);
  if (v.tenantId !== user.id) throw new AppError("FORBIDDEN", "Only the visitor checks in.");
  const t = v.scheduledAt.getTime();
  const now = Date.now();
  if (now < t - CHECK_IN_EARLY_MS || now > t + CHECK_IN_LATE_MS) throw new AppError("INVALID", "Check-in opens 2 hours before the visit time and closes 6 hours after it.");
  const res = await db.visit.updateMany({ where: { id: visitId, status: "CONFIRMED" }, data: { status: "CHECKED_IN", checkedInAt: new Date() } });
  if (res.count === 0) throw new AppError("CONFLICT", "This visit cannot be checked in.");
}

export async function checkOut(db: Db, actor: Actor | null, visitId: string) {
  const user = await requireActiveUser(db, actor);
  const v = await loadVisit(db, user.id, visitId);
  if (v.tenantId !== user.id) throw new AppError("FORBIDDEN", "Only the visitor checks out.");
  const res = await db.visit.updateMany({ where: { id: visitId, status: "CHECKED_IN" }, data: { status: "CHECKED_OUT", checkedOutAt: new Date() } });
  if (res.count === 0) throw new AppError("CONFLICT", "You are not checked in.");
}

/** History for either side. Owners see women and mixed-group visitors only as “Verified tenant”. */
export async function listVisits(db: Db, actor: Actor | null) {
  const user = await requireActiveUser(db, actor);
  const rows = await db.visit.findMany({
    where: { OR: [{ tenantId: user.id }, { listing: { ownerId: user.id } }] },
    orderBy: { scheduledAt: "desc" },
    take: 20,
    select: {
      id: true, status: true, scheduledAt: true, companion: true, note: true, representativeName: true, representativeRole: true,
      checkedInAt: true, checkedOutAt: true, tenantId: true,
      listing: { select: { slug: true, title: true, area: true, ownerId: true } },
      tenant: { select: { name: true } },
    },
  });
  const interestIds = await db.visit.findMany({ where: { id: { in: rows.map((r) => r.id) } }, select: { id: true, interestId: true } });
  const groupByInterest = new Map<string, string>();
  for (const i of await db.interest.findMany({ where: { id: { in: interestIds.map((x) => x.interestId) } }, select: { id: true, requirement: { select: { occupantGroup: true } } } })) {
    groupByInterest.set(i.id, i.requirement.occupantGroup);
  }
  const interestOf = new Map(interestIds.map((x) => [x.id, x.interestId]));

  return rows.map((r) => {
    const asTenant = r.tenantId === user.id;
    const group = groupByInterest.get(interestOf.get(r.id) ?? "") ?? "MEN";
    const visitor = asTenant
      ? "You"
      : toBoardView({ id: r.id, group: group as "WOMEN" | "MEN" | "MIXED", city: "", areas: [], budgetMin: 0, budgetMax: 0, moveInDate: new Date(), tenantType: "", diet: "", intro: "", acceptsInvites: true, tenantName: r.tenant.name }).displayName;
    return {
      id: r.id, status: r.status, scheduledAt: r.scheduledAt, companion: r.companion, note: r.note,
      representativeName: r.representativeName, representativeRole: r.representativeRole,
      checkedInAt: r.checkedInAt, checkedOutAt: r.checkedOutAt, asTenant, visitor,
      listing: { slug: r.listing.slug, title: r.listing.title, area: r.listing.area },
    };
  });
}

/** Data for the calendar file. Only the two parties get it. */
export async function getVisitForCalendar(db: Db, actor: Actor | null, visitId: string) {
  const user = await requireActiveUser(db, actor);
  await loadVisit(db, user.id, visitId);
  return db.visit.findUniqueOrThrow({
    where: { id: visitId },
    select: { id: true, scheduledAt: true, representativeName: true, listing: { select: { title: true, area: true } } },
  });
}
