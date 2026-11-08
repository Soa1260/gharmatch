import { z } from "zod";
import {
  AREAS, CITIES, DIET_POLICIES, FURNISHING, GENDER_POLICIES, HABIT_POLICIES, KEY_HOLDERS, OCCUPANT_GROUPS, OWNER_ACCESS, PARKING,
  PET_POLICIES, SECURITY_FEATURES, TENANT_DIETS, TENANT_TYPES, VISITOR_POLICIES, REPORT_CATEGORIES,
} from "./domain";
import { asksForMoney, containsContactInfo } from "./safety";
import { GUARD_MESSAGE, checkText } from "./textGuard";

/** Free text that must pass the discrimination guard. Borderline text is flagged by the service, not here. */
export function safeText(min: number, max: number) {
  return z
    .string()
    .trim()
    .min(min)
    .max(max)
    .refine((v) => checkText(v).verdict !== "reject", { message: GUARD_MESSAGE });
}

/** Same as safeText but also refuses phone numbers, emails and links. */
export function messageText(min: number, max: number) {
  return safeText(min, max).refine((v) => !containsContactInfo(v), {
    message: "Contact details are shared automatically once the other side accepts. Please remove numbers, emails and links.",
  });
}

const city = z.enum(CITIES);
const money = z.number().int().min(1000).max(1_000_000);
const futureish = z.coerce.date();

export const listingSchema = z
  .object({
    title: safeText(8, 90),
    city,
    area: z.string(),
    rent: money,
    deposit: z.number().int().min(0).max(5_000_000),
    bhk: z.number().int().min(1).max(6),
    furnishing: z.enum(FURNISHING),
    availableFrom: futureish,
    description: messageText(20, 1500),
    dietPolicy: z.enum(DIET_POLICIES),
    tenantTypes: z.array(z.enum(TENANT_TYPES)).min(1).max(TENANT_TYPES.length),
    genderPolicy: z.enum(GENDER_POLICIES).default("ANY"),
    securityFeatures: z.array(z.enum(SECURITY_FEATURES)).max(SECURITY_FEATURES.length).default([]),
    pets: z.enum(PET_POLICIES),
    smoking: z.enum(HABIT_POLICIES),
    alcohol: z.enum(HABIT_POLICIES),
    visitors: z.enum(VISITOR_POLICIES),
    quietHours: safeText(3, 60).optional(),
    minLeaseMonths: z.number().int().min(1).max(60),
    noticeDays: z.number().int().min(0).max(180),
    parking: z.enum(PARKING),
    wfhAllowed: z.boolean(),
    maxOccupants: z.number().int().min(1).max(12),
    mapsLink: z.string().trim().min(5, "Paste a Google Maps link or coordinates.").max(600),
    addressLine: messageText(5, 200),
    cctvLocations: safeText(3, 200).optional(),
    cctvAccess: safeText(3, 200).optional(),
    noPrivateCameras: z.boolean().default(false),
    occupancyNote: messageText(3, 200).optional(),
    ownerLivesOnSite: z.boolean().default(false),
    keyHolders: z.enum(KEY_HOLDERS),
    ownerAccess: z.enum(OWNER_ACCESS),
    noticeHours: z.number().int().min(0).max(168),
  })
  .refine((v) => (AREAS[v.city] as readonly string[]).includes(v.area), { path: ["area"], message: "Choose an area from the list." })
  .refine((v) => !v.securityFeatures.includes("CCTV") || (v.cctvLocations && v.cctvAccess), {
    path: ["cctvLocations"],
    message: "If there is CCTV, say where the cameras are and who can see the recordings.",
  })
  .refine((v) => !v.securityFeatures.includes("CCTV") || v.noPrivateCameras, {
    path: ["noPrivateCameras"],
    message: "Cameras are never allowed in bedrooms, bathrooms or other private spaces. Please confirm.",
  })
  .refine((v) => v.ownerAccess !== "WITH_NOTICE" || v.noticeHours >= 12, {
    path: ["noticeHours"],
    message: "Give at least 12 hours notice before the owner or maintenance enters.",
  });

export type ListingInput = z.infer<typeof listingSchema>;

export const requirementSchema = z
  .object({
    city,
    areas: z.array(z.string()).min(1).max(5),
    budgetMin: z.number().int().min(0).max(1_000_000),
    budgetMax: money,
    moveInDate: futureish,
    tenantType: z.enum(TENANT_TYPES),
    occupantGroup: z.enum(OCCUPANT_GROUPS),
    diet: z.enum(TENANT_DIETS),
    hasPets: z.boolean(),
    smokes: z.boolean(),
    drinks: z.boolean(),
    needsSecurity: z.boolean().default(false),
    acceptsInvites: z.boolean().default(true),
    durationMonths: z.number().int().min(1).max(60),
    occupants: z.number().int().min(1).max(12),
    intro: messageText(10, 400),
  })
  .refine((v) => v.budgetMin <= v.budgetMax, { path: ["budgetMin"], message: "Minimum cannot exceed maximum." })
  .refine((v) => v.areas.every((a) => (AREAS[v.city] as readonly string[]).includes(a)), {
    path: ["areas"],
    message: "Choose areas from the selected city.",
  });

export type RequirementInput = z.infer<typeof requirementSchema>;

export const interestMessageSchema = z.object({
  message: messageText(10, 400).refine((v) => !asksForMoney(v), {
    message: "Please do not discuss payments here. Never pay before you have seen the home in person.",
  }),
  acknowledgeConflicts: z.boolean().default(false),
});

export const reportSchema = z.object({
  targetType: z.enum(["LISTING", "REQUIREMENT", "USER"]),
  targetId: z.string().min(1).max(40),
  category: z.enum(REPORT_CATEGORIES),
  details: z.string().trim().max(800).optional(),
  incidentAt: z.coerce.date().optional().refine((d) => !d || d.getTime() <= Date.now() + 3_600_000, "The time cannot be in the future."),
});

export const appealSchema = z.object({
  reportId: z.string().min(1).max(40),
  message: z.string().trim().min(10, "Please explain in a few words.").max(800),
});

export const trustedContactSchema = z.object({
  name: z.string().trim().min(1).max(60),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number").optional(),
  isLandlord: z.boolean(),
  isTenant: z.boolean(),
})
  .refine((v) => v.isLandlord || v.isTenant, { path: ["isTenant"], message: "Choose at least one role." })
  // People who rent out a home must be reachable by us if a tenant reports a problem.
  .refine((v) => !v.isLandlord || Boolean(v.phone), { path: ["phone"], message: "Landlords need a mobile number. It stays hidden until you accept a tenant." });
