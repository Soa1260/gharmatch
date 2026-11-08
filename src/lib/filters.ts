import { DIET_POLICIES, FURNISHING, GENDER_POLICIES, PARKING, PET_POLICIES, SECURITY_FEATURES, TENANT_TYPES } from "./domain";
import { label } from "./labels";

/** The dropdown's groups. `param` is the URL key, `values` the only values the server will accept. */
export const FILTER_GROUPS = [
  { param: "for", title: "Who it is for", values: GENDER_POLICIES.filter((g) => g !== "ANY"), labels: label.gender },
  { param: "type", title: "Household type", values: TENANT_TYPES, labels: label.tenantType },
  { param: "diet", title: "Food rules", values: DIET_POLICIES, labels: label.diet },
  { param: "furn", title: "Furnishing", values: FURNISHING, labels: label.furnishing },
  { param: "sec", title: "Security (must have all)", values: SECURITY_FEATURES, labels: label.security },
  { param: "pets", title: "Pets", values: PET_POLICIES, labels: label.pets },
  { param: "park", title: "Parking", values: PARKING, labels: label.parking },
] as const;

export type FilterParam = (typeof FILTER_GROUPS)[number]["param"];

/** Reads a comma-separated URL value and keeps only values the group allows. Unknown values are dropped. */
export function parseMulti(raw: string | string[] | undefined, allowed: readonly string[]): string[] {
  const text = Array.isArray(raw) ? raw[0] : raw;
  if (!text) return [];
  return [...new Set(text.split(",").map((s) => s.trim()).filter((s) => allowed.includes(s)))];
}
