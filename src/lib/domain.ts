export const CITIES = ["AHMEDABAD", "GANDHINAGAR"] as const;
export type City = (typeof CITIES)[number];

export const CITY_LABEL: Record<City, string> = {
  AHMEDABAD: "Ahmedabad",
  GANDHINAGAR: "Gandhinagar",
};

export const AREAS: Record<City, readonly string[]> = {
  AHMEDABAD: [
    "Bopal", "South Bopal", "Shela", "Thaltej", "Bodakdev", "Satellite", "Vastrapur",
    "Navrangpura", "Maninagar", "Naroda", "Chandkheda", "Gota", "SG Highway",
    "Prahladnagar", "Sanand", "Ghatlodia", "Ambawadi", "Paldi",
  ],
  GANDHINAGAR: [
    "Kudasan", "Sargasan", "Raysan", "Randesan", "Koba", "Infocity", "GIFT City",
    "Adalaj", "Vavol", "Pethapur",
    ...Array.from({ length: 30 }, (_, i) => `Sector ${i + 1}`),
  ],
};

export function isValidArea(city: City, area: string): boolean {
  return AREAS[city].includes(area);
}

export const DIET_POLICIES = ["VEG_ONLY", "EGG_ONLY", "NON_VEG_ALLOWED", "NO_RESTRICTION"] as const;
export const TENANT_DIETS = ["VEG", "EGG", "NON_VEG"] as const;
export const TENANT_TYPES = ["FAMILY", "BACHELORS", "WORKING_WOMEN", "STUDENTS", "SHARING"] as const;
export const PET_POLICIES = ["ALLOWED", "CASE_BY_CASE", "NOT_ALLOWED"] as const;
export const HABIT_POLICIES = ["ALLOWED", "OUTDOORS_ONLY", "NOT_ALLOWED"] as const;
export const VISITOR_POLICIES = ["FREE", "DAYTIME_ONLY", "LIMITED"] as const;
export const FURNISHING = ["UNFURNISHED", "SEMI_FURNISHED", "FURNISHED"] as const;
export const PARKING = ["NONE", "TWO_WHEELER", "FOUR_WHEELER", "BOTH"] as const;

export type DietPolicy = (typeof DIET_POLICIES)[number];
export type TenantDiet = (typeof TENANT_DIETS)[number];
export type TenantType = (typeof TENANT_TYPES)[number];
export type PetPolicy = (typeof PET_POLICIES)[number];
export type HabitPolicy = (typeof HABIT_POLICIES)[number];

export const LISTING_LIFETIME_DAYS = 30;
export const MAX_PHOTOS_PER_LISTING = 5;
export const MAX_PHOTO_BYTES = 400 * 1024;
export const PHOTO_TYPES = ["image/webp", "image/jpeg"] as const;
export const PAGE_SIZE = 12;

export const GENDER_POLICIES = ["ANY", "WOMEN_ONLY", "MEN_ONLY"] as const;
export const OCCUPANT_GROUPS = ["WOMEN", "MEN", "MIXED"] as const;
/** The 13 items of the property safety assessment, plus one extra people-based item. */
export const SECURITY_FEATURES = [
  "MAIN_DOOR_SECURITY", "DOOR_LOCKS", "WINDOW_SECURITY", "BALCONY_SECURITY", "ENTRANCE_SECURITY",
  "CCTV", "COMMON_LIGHTING", "VISITOR_MANAGEMENT", "INTERCOM", "EMERGENCY_EXITS", "FIRE_SAFETY",
  "PARKING_SECURITY", "BUILDING_ACCESS_CONTROL", "FEMALE_CARETAKER",
] as const;
export const ASSESSMENT_ITEMS = SECURITY_FEATURES.filter((f) => f !== "FEMALE_CARETAKER");
export const REPORT_CATEGORIES = [
  "NEED_HELP", "PHYSICAL_THREAT_STALKING", "UNAUTHORIZED_ENTRY", "LANDLORD_HARASSMENT", "UNDISCLOSED_SURVEILLANCE",
  "PROPERTY_SAFETY_VIOLATION", "SUSPICIOUS_REPRESENTATIVE", "FINANCIAL_FRAUD", "OCCUPANCY_VIOLATION", "DISCRIMINATION", "OTHER",
] as const;

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM";

/**
 * How serious a report is on its face. CRITICAL and HIGH pause the listing at once as a precaution,
 * which is a hold and not a finding. MEDIUM pauses only when two different people report it.
 */
export const REPORT_SEVERITY: Record<(typeof REPORT_CATEGORIES)[number], Severity> = {
  NEED_HELP: "CRITICAL",
  PHYSICAL_THREAT_STALKING: "CRITICAL",
  UNAUTHORIZED_ENTRY: "CRITICAL",
  LANDLORD_HARASSMENT: "HIGH",
  UNDISCLOSED_SURVEILLANCE: "HIGH",
  PROPERTY_SAFETY_VIOLATION: "HIGH",
  SUSPICIOUS_REPRESENTATIVE: "HIGH",
  FINANCIAL_FRAUD: "HIGH",
  OCCUPANCY_VIOLATION: "MEDIUM",
  DISCRIMINATION: "MEDIUM",
  OTHER: "MEDIUM",
};
export const URGENT_REPORT_CATEGORIES: readonly string[] = REPORT_CATEGORIES.filter((c) => REPORT_SEVERITY[c] !== "MEDIUM");

export const KEY_HOLDERS = ["TENANT_ONLY", "OWNER", "CARETAKER", "OWNER_AND_CARETAKER"] as const;
export const OWNER_ACCESS = ["WITH_NOTICE", "WITH_CONSENT", "EMERGENCY_ONLY"] as const;
export const OWNERSHIP_DOCS = ["PROPERTY_TAX_RECEIPT", "UTILITY_BILL", "PROPERTY_CARD", "AUTHORIZATION_LETTER"] as const;
export const IDENTITY_METHODS = ["PHOTO_ID_SEEN_IN_PERSON", "PHOTO_ID_SEEN_ON_VIDEO"] as const;
export const VISIT_STATUSES = ["REQUESTED", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"] as const;

/** Distinct people who must report the same listing or search before it is paused automatically. */
export const AUTO_PAUSE_REPORTERS = 2;
/** A reporter with this many dismissed reports in 30 days no longer counts toward automatic holds. */
export const DISMISSED_REPORT_LIMIT = 3;

export type GenderPolicy = (typeof GENDER_POLICIES)[number];
export type OccupantGroup = (typeof OCCUPANT_GROUPS)[number];
