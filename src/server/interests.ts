import type { DietPolicy, GenderPolicy, HabitPolicy, OccupantGroup, PetPolicy, TenantDiet, TenantType, City } from "@/lib/domain";
import { PAGE_SIZE } from "@/lib/domain";
import { matchListing, type ListingFacts, type RequirementFacts } from "@/lib/matching";
import { canInvite, toBoardView } from "@/lib/safety";
import { interestMessageSchema } from "@/lib/schemas";
import { isBlockedEitherWay, requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError, isUniqueViolation } from "./errors";
import { enforce, type RateLimiter } from "./rateLimit";

/** Conflicts about who may live in the home or where it is can never be acknowledged away. */
const UNOVERRIDABLE = new Set(["occupantGroup", "city", "tenantType"]);

type ListingRow = {
  city: string; area: string; rent: number; availableFrom: Date; dietPolicy: string; tenantTypes: string[];
  pets: string; smoking: string; alcohol: string; minLeaseMonths: number; maxOccupants: number;
  genderPolicy: string; securityFeatures: string[];
};
type RequirementRow = {
  city: string; areas: string[]; budgetMax: number; moveInDate: Date; tenantType: string; diet: string;
  pets: string; smoking: string; alcohol: string; durationMonths: number; occupants: number;
  occupantGroup: string; needsSecurity: boolean;
};

export function listingFacts(l: ListingRow): ListingFacts {
  return {
    city: l.city as City, area: l.area, rent: l.rent, availableFrom: l.availableFrom,
    dietPolicy: l.dietPolicy as DietPolicy, tenantTypes: l.tenantTypes as TenantType[], pets: l.pets as PetPolicy,
    smoking: l.smoking as HabitPolicy, alcohol: l.alcohol as HabitPolicy, minLeaseMonths: l.minLeaseMonths,
    maxOccupants: l.maxOccupants, genderPolicy: l.genderPolicy as GenderPolicy, securityFeatures: l.securityFeatures,
  };
}

export function requirementFacts(r: RequirementRow): RequirementFacts {
  return {
    city: r.city as City, areas: r.areas, budgetMax: r.budgetMax, moveInDate: r.moveInDate,
    tenantType: r.tenantType as TenantType, diet: r.diet as TenantDiet, hasPets: r.pets === "YES",
    smokes: r.smoking === "YES", drinks: r.alcohol === "YES", durationMonths: r.durationMonths,
    occupants: r.occupants, occupantGroup: r.occupantGroup as OccupantGroup, needsSecurity: r.needsSecurity,
  };
}

const listingMatchSelect = {
  id: true, ownerId: true, status: true, expiresAt: true, city: true, area: true, rent: true, availableFrom: true,
  dietPolicy: true, tenantTypes: true, pets: true, smoking: true, alcohol: true, minLeaseMonths: true,
  maxOccupants: true, genderPolicy: true, securityFeatures: true,
} as const;

const requirementMatchSelect = {
  id: true, tenantId: true, status: true, city: true, areas: true, budgetMax: true, moveInDate: true,
  tenantType: true, diet: true, pets: true, smoking: true, alcohol: true, durationMonths: true,
  occupants: true, occupantGroup: true, needsSecurity: true, acceptsInvites: true,
} as const;

async function createInterest(
  db: Db,
  data: { listingId: string; requirementId: string; origin: "TENANT" | "LANDLORD"; message: string },
) {
  try {
    const row = await db.interest.create({ data, select: { id: true } });
    await db.event.create({ data: { name: data.origin === "TENANT" ? "interest_sent" : "invite_sent" } });
    return row;
  } catch (e) {
    if (isUniqueViolation(e)) throw new AppError("CONFLICT", "There is already a conversation between this home and this search.");
    throw e;
  }
}

export async function sendInterest(
  db: Db, limiter: RateLimiter, actor: Actor | null, listingId: string, requirementId: string, raw: unknown,
) {
  const user = await requireActiveUser(db, actor);
  const input = interestMessageSchema.parse(raw);
  await enforce(limiter, "sendInterest", user.id);

  const requirement = await db.requirement.findUnique({ where: { id: requirementId }, select: requirementMatchSelect });
  if (!requirement || requirement.tenantId !== user.id || requirement.status !== "ACTIVE") {
    throw new AppError("NOT_FOUND", "Search not found.");
  }
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: listingMatchSelect });
  if (!listing || listing.status !== "ACTIVE" || listing.expiresAt <= new Date()) {
    throw new AppError("NOT_FOUND", "This home is no longer available.");
  }
  if (listing.ownerId === user.id) throw new AppError("INVALID", "You cannot send interest to your own home.");
  if (await isBlockedEitherWay(db, user.id, listing.ownerId)) throw new AppError("NOT_FOUND", "This home is no longer available.");

  const result = matchListing(requirementFacts(requirement), listingFacts(listing));
  const fixed = result.hardConflicts.filter((c) => UNOVERRIDABLE.has(c.code));
  if (fixed.length > 0) throw new AppError("INVALID", fixed.map((c) => c.text).join(" "));
  if (result.hardConflicts.length > 0 && !input.acknowledgeConflicts) {
    throw new AppError("INVALID", `Please review the conflicts first: ${result.hardConflicts.map((c) => c.text).join(" ")}`);
  }
  return createInterest(db, { listingId, requirementId, origin: "TENANT", message: input.message });
}

export async function inviteTenant(
  db: Db, limiter: RateLimiter, actor: Actor | null, listingId: string, requirementId: string, raw: unknown,
) {
  const user = await requireActiveUser(db, actor);
  const input = interestMessageSchema.parse(raw);
  await enforce(limiter, "invite", user.id);

  const listing = await db.listing.findUnique({ where: { id: listingId }, select: listingMatchSelect });
  if (!listing || listing.ownerId !== user.id || listing.status !== "ACTIVE" || listing.expiresAt <= new Date()) {
    throw new AppError("NOT_FOUND", "Listing not found.");
  }
  const requirement = await db.requirement.findUnique({ where: { id: requirementId }, select: requirementMatchSelect });
  if (!requirement || requirement.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Search not found.");
  const tenant = await db.user.findUnique({ where: { id: requirement.tenantId }, select: { status: true } });
  if (!tenant || tenant.status !== "ACTIVE") throw new AppError("NOT_FOUND", "Search not found.");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [activeListingCount, invitesSentToday, blocked] = await Promise.all([
    db.listing.count({ where: { ownerId: user.id, status: "ACTIVE" } }),
    db.interest.count({ where: { origin: "LANDLORD", createdAt: { gte: startOfDay }, listing: { ownerId: user.id }, requirement: { occupantGroup: { not: "MEN" } } } }),
    isBlockedEitherWay(db, user.id, requirement.tenantId),
  ]);
  if (requirement.occupantGroup !== "MEN") {
    const actioned = await db.report.count({
      where: {
        status: "ACTIONED",
        OR: [{ targetType: "USER", targetId: user.id }, { targetType: "LISTING", targetId: { in: (await db.listing.findMany({ where: { ownerId: user.id }, select: { id: true }, take: 50 })).map((x) => x.id) } }],
      },
    });
    if (actioned > 0) throw new AppError("FORBIDDEN", "Your account cannot invite women or mixed groups after a safety report was upheld.");
  }
  const decision = canInvite(
    {
      id: user.id, emailVerified: user.emailVerified, hasPhoneOnFile: user.hasPhoneOnFile, banned: false,
      activeListingCount, invitesSentToday: requirement.occupantGroup === "MEN" ? 0 : invitesSentToday, blockedByTarget: blocked,
    },
    { group: requirement.occupantGroup as OccupantGroup, acceptsInvites: requirement.acceptsInvites, ownerId: requirement.tenantId },
  );
  if (!decision.allowed) throw new AppError("FORBIDDEN", decision.reason);

  const fixed = matchListing(requirementFacts(requirement), listingFacts(listing)).hardConflicts.filter((c) => UNOVERRIDABLE.has(c.code));
  if (fixed.length > 0) throw new AppError("INVALID", "This search does not fit your home's basic rules.");
  return createInterest(db, { listingId, requirementId, origin: "LANDLORD", message: input.message });
}

async function loadParty(db: Db, userId: string, interestId: string) {
  const i = await db.interest.findUnique({
    where: { id: interestId },
    select: {
      id: true, origin: true, status: true,
      listing: { select: { ownerId: true } },
      requirement: { select: { tenantId: true } },
    },
  });
  const isParty = i && (i.listing.ownerId === userId || i.requirement.tenantId === userId);
  if (!i || !isParty) throw new AppError("NOT_FOUND", "Not found.");
  const recipientId = i.origin === "TENANT" ? i.listing.ownerId : i.requirement.tenantId;
  const senderId = i.origin === "TENANT" ? i.requirement.tenantId : i.listing.ownerId;
  return { id: i.id, status: i.status, recipientId, senderId };
}

export async function respondToInterest(db: Db, actor: Actor | null, interestId: string, decision: "ACCEPT" | "DECLINE") {
  const user = await requireActiveUser(db, actor);
  const party = await loadParty(db, user.id, interestId);
  if (party.recipientId !== user.id) throw new AppError("FORBIDDEN", "Only the person who received this can respond.");
  if (await isBlockedEitherWay(db, party.senderId, party.recipientId)) throw new AppError("NOT_FOUND", "Not found.");
  const status = decision === "ACCEPT" ? "ACCEPTED" : "DECLINED";
  const res = await db.interest.updateMany({
    where: { id: interestId, status: "PENDING" },
    data: { status, respondedAt: new Date() },
  });
  if (res.count === 0) throw new AppError("CONFLICT", "This was already answered.");
  if (status === "ACCEPTED") await db.event.create({ data: { name: "interest_accepted" } });
}

export async function withdrawInterest(db: Db, actor: Actor | null, interestId: string) {
  const user = await requireActiveUser(db, actor);
  const party = await loadParty(db, user.id, interestId);
  if (party.senderId !== user.id) throw new AppError("FORBIDDEN", "Only the sender can withdraw.");
  const res = await db.interest.updateMany({ where: { id: interestId, status: "PENDING" }, data: { status: "WITHDRAWN", respondedAt: new Date() } });
  if (res.count === 0) throw new AppError("CONFLICT", "This can no longer be withdrawn.");
}

/** Interests where the actor is a party. Never includes contact details. */
export async function listMyInterests(db: Db, actor: Actor | null, box: "received" | "sent", cursor?: string) {
  const user = await requireActiveUser(db, actor);
  const mine = { OR: [{ listing: { ownerId: user.id } }, { requirement: { tenantId: user.id } }] };
  const side =
    box === "received"
      ? { OR: [{ origin: "TENANT" as const, listing: { ownerId: user.id } }, { origin: "LANDLORD" as const, requirement: { tenantId: user.id } }] }
      : { OR: [{ origin: "TENANT" as const, requirement: { tenantId: user.id } }, { origin: "LANDLORD" as const, listing: { ownerId: user.id } }] };
  const rows = await db.interest.findMany({
    where: { AND: [mine, side] },
    select: {
      id: true, origin: true, status: true, message: true, createdAt: true,
      listing: { select: { id: true, slug: true, title: true, area: true, ownerId: true } },
      requirement: {
        select: {
          id: true, occupantGroup: true, city: true, areas: true, budgetMin: true, budgetMax: true, moveInDate: true,
          tenantType: true, diet: true, intro: true, acceptsInvites: true, tenantId: true, tenant: { select: { name: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  return rows.map((r) => ({
    id: r.id, origin: r.origin, status: r.status, message: r.message, createdAt: r.createdAt,
    listing: { id: r.listing.id, slug: r.listing.slug, title: r.listing.title, area: r.listing.area },
    tenant: toBoardView({
      id: r.requirement.id, group: r.requirement.occupantGroup as OccupantGroup, city: r.requirement.city,
      areas: r.requirement.areas, budgetMin: r.requirement.budgetMin, budgetMax: r.requirement.budgetMax,
      moveInDate: r.requirement.moveInDate, tenantType: r.requirement.tenantType, diet: r.requirement.diet,
      intro: r.requirement.intro, acceptsInvites: r.requirement.acceptsInvites, tenantName: r.requirement.tenant.name,
    }),
    viewerIsTenant: r.requirement.tenantId === user.id,
  }));
}
