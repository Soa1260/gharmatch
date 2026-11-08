import { randomBytes } from "node:crypto";
import { LISTING_LIFETIME_DAYS, PAGE_SIZE, type City } from "@/lib/domain";
import { listingSchema, type ListingInput } from "@/lib/schemas";
import { scamSignals } from "@/lib/safety";
import { approximate, checkLocation } from "@/lib/location";
import { checkText } from "@/lib/textGuard";
import { requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError, isUniqueViolation } from "./errors";
import { resolveLocation } from "./mapsLink";
import { enforce, type RateLimiter } from "./rateLimit";

const DAY_MS = 86_400_000;

function slugFor(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
  return `${base || "home"}-${randomBytes(3).toString("hex")}`;
}

function guardFlag(input: ListingInput): boolean {
  const text = [input.title, input.description, input.quietHours ?? "", input.addressLine, input.occupancyNote ?? ""].join(" \n ");
  return checkText(text).verdict === "flag" || scamSignals(text).length > 0;
}

/**
 * Every landlord must have a mobile number on file, so a person we can reach stands behind each listing.
 * It stays hidden from tenants until an interest is accepted. Checked here, not only in the form.
 */
function requirePhoneForLandlord(_input: ListingInput, hasPhone: boolean) {
  if (!hasPhone) {
    throw new AppError("FORBIDDEN", "Add a mobile number to your profile before posting a home. It stays hidden from tenants until you accept someone.");
  }
}

type Resolver = typeof resolveLocation;

/**
 * Turns the pasted link into a checked point. The pin must be a real place inside the chosen city.
 * A pin far from the chosen area is allowed but the listing is held for a person to look at.
 * This shows the point is plausible, not that the landlord owns the home.
 */
async function locate(input: ListingInput, resolver: Resolver) {
  const point = await resolver(input.mapsLink);
  if (!point) {
    throw new AppError(
      "INVALID",
      "We could not find a location in that link. Open the home in Google Maps, tap Share, copy the link and paste it here. You can also paste coordinates like 23.0302, 72.4711.",
    );
  }
  const check = checkLocation(input.city, input.area, point);
  if (!check.ok) throw new AppError("INVALID", check.reason);
  return { point, status: check.status };
}

function toData(input: ListingInput) {
  const { mapsLink: _mapsLink, noPrivateCameras: _noPrivateCameras, ...rest } = input;
  void _mapsLink;
  void _noPrivateCameras;
  return rest;
}

export async function createListing(db: Db, limiter: RateLimiter, actor: Actor | null, raw: unknown, resolver: Resolver = resolveLocation) {
  const user = await requireActiveUser(db, actor);
  if (!user.isLandlord) throw new AppError("FORBIDDEN", "Switch on the landlord role in your profile first.");
  // Validation comes first so a mistake in the form does not use up one of the day's five posts.
  // Looking up a map link is the costly part, so it has its own, looser limit.
  const input = listingSchema.parse(raw);
  requirePhoneForLandlord(input, user.hasPhoneOnFile);
  await enforce(limiter, "locate", user.id);
  const { point, status } = await locate(input, resolver);
  await enforce(limiter, "createListing", user.id);
  const expiresAt = new Date(Date.now() + LISTING_LIFETIME_DAYS * DAY_MS);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.listing.create({
        data: {
          ...toData(input),
          ownerId: user.id,
          slug: slugFor(input.title),
          expiresAt,
          lat: point.lat,
          lng: point.lng,
          locationStatus: status,
          locationCheckedAt: new Date(),
          flagged: guardFlag(input) || status === "FAR_FROM_AREA",
        },
        select: { id: true, slug: true },
      });
    } catch (e) {
      if (!isUniqueViolation(e) || attempt === 2) throw e;
    }
  }
  throw new AppError("CONFLICT", "Could not create the listing. Please try again.");
}

async function ownedListing(db: Db, userId: string, listingId: string) {
  const listing = await db.listing.findUnique({ where: { id: listingId }, select: { id: true, ownerId: true, status: true, flagged: true } });
  if (!listing || listing.ownerId !== userId || listing.status === "DELETED") {
    throw new AppError("NOT_FOUND", "Listing not found.");
  }
  return listing;
}

/**
 * An edit can add holds but never remove them. A listing held after a safety report or for wording stays
 * held until an admin releases it, so editing cannot be used to dodge a review.
 */
export async function updateListing(db: Db, actor: Actor | null, listingId: string, raw: unknown, resolver: Resolver = resolveLocation) {
  const user = await requireActiveUser(db, actor);
  const existing = await ownedListing(db, user.id, listingId);
  const input = listingSchema.parse(raw);
  requirePhoneForLandlord(input, user.hasPhoneOnFile);
  const { point, status } = await locate(input, resolver);
  return db.listing.update({
    where: { id: listingId },
    data: {
      ...toData(input),
      lat: point.lat,
      lng: point.lng,
      locationStatus: status,
      locationCheckedAt: new Date(),
      flagged: existing.flagged || guardFlag(input) || status === "FAR_FROM_AREA",
    },
    select: { id: true, slug: true },
  });
}

export async function setListingStatus(db: Db, actor: Actor | null, listingId: string, status: "ACTIVE" | "PAUSED" | "DELETED") {
  const user = await requireActiveUser(db, actor);
  await ownedListing(db, user.id, listingId);
  const data =
    status === "ACTIVE"
      ? { status, lastConfirmedAt: new Date(), expiresAt: new Date(Date.now() + LISTING_LIFETIME_DAYS * DAY_MS) }
      : { status };
  await db.listing.update({ where: { id: listingId }, data });
  // A deleted home cannot be visited: cancel visits still waiting or confirmed, so nobody is sent to an address
  // that is no longer on offer. Finished visits (checked in or out) keep their record.
  if (status === "DELETED") {
    await db.visit.updateMany({ where: { listingId, status: { in: ["REQUESTED", "CONFIRMED"] } }, data: { status: "CANCELLED" } });
  }
}

/** The "still available?" button: restarts the 30-day clock. */
export async function confirmStillAvailable(db: Db, actor: Actor | null, listingId: string) {
  return setListingStatus(db, actor, listingId, "ACTIVE");
}

export async function listMine(db: Db, actor: Actor | null, cursor?: string) {
  const user = await requireActiveUser(db, actor);
  return db.listing.findMany({
    where: { ownerId: user.id, status: { not: "DELETED" } },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

/** Fields safe for anonymous visitors. No owner id, no exact address, no contact details. */
const publicSelect = {
  id: true, slug: true, title: true, city: true, area: true, rent: true, deposit: true, bhk: true,
  furnishing: true, availableFrom: true, description: true, dietPolicy: true, tenantTypes: true,
  genderPolicy: true, securityFeatures: true, pets: true, smoking: true, alcohol: true, visitors: true,
  quietHours: true, minLeaseMonths: true, noticeDays: true, parking: true, wfhAllowed: true, maxOccupants: true,
  lastConfirmedAt: true,
  cctvLocations: true, cctvAccess: true, occupancyNote: true, ownerLivesOnSite: true, keyHolders: true,
  ownerAccess: true, noticeHours: true, locationStatus: true, locationCheckedAt: true,
  ownershipReviewedAt: true, ownershipDocType: true,
  owner: { select: { emailVerified: true, identityCheckedAt: true, identityMethod: true } },
  inspections: { select: { inspectedAt: true, verifiedItems: true }, orderBy: { inspectedAt: "desc" as const }, take: 1 },
  photos: { select: { objectKey: true }, orderBy: { position: "asc" as const }, take: 5 },
} as const;

export async function getPublicListing(db: Db, slug: string) {
  return db.listing.findFirst({
    where: { slug, status: "ACTIVE", flagged: false, expiresAt: { gt: new Date() }, owner: { status: "ACTIVE" } },
    select: publicSelect,
  });
}

export interface BrowseFilters {
  city?: City;
  area?: string;
  minRent?: number;
  maxRent?: number;
  bhk?: number;
  furnishing?: string[];
  dietPolicy?: string[];
  genderPolicy?: string[];
  tenantTypes?: string[];
  security?: string[];
  pets?: string[];
  parking?: string[];
  cursor?: string;
}

export async function browseListings(db: Db, f: BrowseFilters) {
  const rows = await db.listing.findMany({
    where: {
      status: "ACTIVE",
      flagged: false,
      expiresAt: { gt: new Date() },
      owner: { status: "ACTIVE" },
      ...(f.city ? { city: f.city } : {}),
      ...(f.area ? { area: f.area } : {}),
      ...(f.bhk ? { bhk: f.bhk } : {}),
      ...(f.genderPolicy?.length ? { genderPolicy: { in: f.genderPolicy } } : {}),
      ...(f.furnishing?.length ? { furnishing: { in: f.furnishing } } : {}),
      ...(f.dietPolicy?.length ? { dietPolicy: { in: f.dietPolicy } } : {}),
      ...(f.pets?.length ? { pets: { in: f.pets } } : {}),
      ...(f.parking?.length ? { parking: { in: f.parking } } : {}),
      ...(f.tenantTypes?.length ? { tenantTypes: { hasSome: f.tenantTypes } } : {}),
      ...(f.security?.length ? { securityFeatures: { hasEvery: f.security } } : {}),
      ...(f.minRent || f.maxRent ? { rent: { ...(f.minRent ? { gte: f.minRent } : {}), ...(f.maxRent ? { lte: f.maxRent } : {}) } } : {}),
    },
    select: publicSelect,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE + 1,
    ...(f.cursor ? { cursor: { id: f.cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > PAGE_SIZE;
  const items = rows.slice(0, PAGE_SIZE);
  return { items, nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null };
}

/** Approximate point for the public map. The exact coordinates and address never leave the server through this path. */
export async function getApproxLocation(db: Db, listingId: string) {
  const row = await db.listing.findUnique({ where: { id: listingId }, select: { lat: true, lng: true } });
  if (row?.lat == null || row.lng == null) return null;
  return approximate({ lat: row.lat, lng: row.lng });
}
