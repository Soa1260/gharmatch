import type { City, DietPolicy, GenderPolicy, HabitPolicy, OccupantGroup, PetPolicy, TenantDiet, TenantType } from "./domain";
import { CITY_LABEL } from "./domain";
import { label } from "./labels";

export interface ListingFacts {
  city: City;
  area: string;
  rent: number;
  availableFrom: Date;
  dietPolicy: DietPolicy;
  tenantTypes: TenantType[];
  pets: PetPolicy;
  smoking: HabitPolicy;
  alcohol: HabitPolicy;
  minLeaseMonths: number;
  maxOccupants: number;
  genderPolicy: GenderPolicy;
  securityFeatures: string[];
}

export interface RequirementFacts {
  city: City;
  areas: string[];
  budgetMax: number;
  moveInDate: Date;
  tenantType: TenantType;
  diet: TenantDiet;
  hasPets: boolean;
  smokes: boolean;
  drinks: boolean;
  durationMonths: number;
  occupants: number;
  occupantGroup: OccupantGroup;
  needsSecurity: boolean;
}

export interface Reason {
  code: string;
  text: string;
}

export interface MatchResult {
  score: number;
  hardConflicts: Reason[];
  matches: Reason[];
  cautions: Reason[];
}

/** Neighbouring areas earn partial credit when the exact area is not requested. */
const NEARBY: Array<[string, string]> = [
  ["Bopal", "South Bopal"], ["Bopal", "Shela"], ["South Bopal", "Shela"],
  ["Thaltej", "Bodakdev"], ["Bodakdev", "Satellite"], ["Satellite", "Vastrapur"],
  ["Vastrapur", "Navrangpura"], ["Thaltej", "SG Highway"], ["Bodakdev", "SG Highway"],
  ["Gota", "Chandkheda"], ["Koba", "Sargasan"], ["Sargasan", "Kudasan"],
  ["Kudasan", "Raysan"], ["Randesan", "Raysan"], ["Infocity", "Koba"], ["GIFT City", "Sargasan"],
];

function isNearby(a: string, b: string): boolean {
  return NEARBY.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

const DAY_MS = 86_400_000;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export function matchListing(req: RequirementFacts, listing: ListingFacts): MatchResult {
  const hard: Reason[] = [];
  const good: Reason[] = [];
  const caution: Reason[] = [];
  let earned = 0;
  let possible = 0;

  const weigh = (weight: number, outcome: boolean | "partial") => {
    possible += weight;
    earned += outcome === true ? weight : outcome === "partial" ? weight / 2 : 0;
  };

  if (req.city !== listing.city) {
    hard.push({ code: "city", text: `This home is in ${CITY_LABEL[listing.city]}, outside the city you are searching in.` });
    weigh(20, false);
  } else if (req.areas.includes(listing.area)) {
    good.push({ code: "area", text: `${listing.area} is one of your areas.` });
    weigh(20, true);
  } else if (req.areas.some((a) => isNearby(a, listing.area))) {
    caution.push({ code: "area", text: `${listing.area} is next to an area you picked.` });
    weigh(20, "partial");
  } else {
    caution.push({ code: "area", text: `${listing.area} is not in your chosen areas.` });
    weigh(20, false);
  }

  if (listing.rent > req.budgetMax) {
    hard.push({ code: "budget", text: `Rent is ${inr(listing.rent)}, above your ${inr(req.budgetMax)} maximum.` });
    weigh(20, false);
  } else {
    good.push({ code: "budget", text: "Rent is within your budget." });
    weigh(20, true);
  }

  const dietBlocked =
    (listing.dietPolicy === "VEG_ONLY" && req.diet !== "VEG") ||
    (listing.dietPolicy === "EGG_ONLY" && req.diet === "NON_VEG");
  if (dietBlocked) {
    const rule = listing.dietPolicy === "VEG_ONLY" ? "vegetarian food only" : "vegetarian and egg only";
    const yours = req.diet === "NON_VEG" ? "non-veg" : "egg";
    hard.push({ code: "diet", text: `House rule is ${rule}; your profile says ${yours}.` });
    weigh(15, false);
  } else {
    good.push({ code: "diet", text: "Food rules fit." });
    weigh(15, true);
  }

  if (!listing.tenantTypes.includes(req.tenantType)) {
    hard.push({ code: "tenantType", text: "This home is not offered to your household type." });
    weigh(15, false);
  } else {
    good.push({ code: "tenantType", text: "Your household type is accepted." });
    weigh(15, true);
  }

  const genderBlocked =
    (listing.genderPolicy === "WOMEN_ONLY" && req.occupantGroup !== "WOMEN") ||
    (listing.genderPolicy === "MEN_ONLY" && req.occupantGroup !== "MEN");
  if (genderBlocked) {
    const who = listing.genderPolicy === "WOMEN_ONLY" ? "women" : "men";
    hard.push({ code: "occupantGroup", text: `This home is for ${who} only.` });
    weigh(15, false);
  } else {
    if (listing.genderPolicy !== "ANY") {
      const who = listing.genderPolicy === "WOMEN_ONLY" ? "women" : "men";
      good.push({ code: "occupantGroup", text: `A ${who}-only home, which matches your group.` });
    }
    weigh(15, true);
  }

  if (req.needsSecurity) {
    if (listing.securityFeatures.length === 0) {
      caution.push({ code: "security", text: "The landlord has not listed any security features. Ask before visiting." });
      weigh(8, false);
    } else {
      good.push({ code: "security", text: `Security: ${listing.securityFeatures.map((f) => label.security[f as keyof typeof label.security] ?? f).join(", ")}.` });
      weigh(8, true);
    }
  }

  if (req.hasPets) {
    if (listing.pets === "NOT_ALLOWED") {
      hard.push({ code: "pets", text: "Pets are not allowed." });
      weigh(8, false);
    } else if (listing.pets === "CASE_BY_CASE") {
      caution.push({ code: "pets", text: "Pets are decided case by case. Ask before visiting." });
      weigh(8, "partial");
    } else {
      good.push({ code: "pets", text: "Pets are allowed." });
      weigh(8, true);
    }
  }

  const habits = [
    { code: "smoking", active: req.smokes, policy: listing.smoking, label: "Smoking", weight: 6 },
    { code: "alcohol", active: req.drinks, policy: listing.alcohol, label: "Alcohol", weight: 6 },
  ];
  for (const habit of habits) {
    if (!habit.active) continue;
    if (habit.policy === "NOT_ALLOWED") {
      hard.push({ code: habit.code, text: `${habit.label} is not allowed.` });
      weigh(habit.weight, false);
    } else if (habit.policy === "OUTDOORS_ONLY") {
      caution.push({ code: habit.code, text: `${habit.label} is allowed outdoors only.` });
      weigh(habit.weight, "partial");
    } else {
      good.push({ code: habit.code, text: `${habit.label} is allowed.` });
      weigh(habit.weight, true);
    }
  }

  if (req.occupants > listing.maxOccupants) {
    hard.push({ code: "occupants", text: `Maximum ${listing.maxOccupants} people; you listed ${req.occupants}.` });
    weigh(8, false);
  } else {
    weigh(8, true);
  }

  if (req.durationMonths < listing.minLeaseMonths) {
    hard.push({ code: "lease", text: `Minimum lease is ${listing.minLeaseMonths} months; you plan ${req.durationMonths}.` });
    weigh(8, false);
  } else {
    good.push({ code: "lease", text: "Lease length works." });
    weigh(8, true);
  }

  const lateByDays = Math.ceil((listing.availableFrom.getTime() - req.moveInDate.getTime()) / DAY_MS);
  if (lateByDays > 30) {
    caution.push({ code: "moveIn", text: `Available ${lateByDays} days after your move-in date.` });
    weigh(10, false);
  } else if (lateByDays > 0) {
    caution.push({ code: "moveIn", text: `Available ${lateByDays} days after your move-in date.` });
    weigh(10, "partial");
  } else {
    good.push({ code: "moveIn", text: "Available by your move-in date." });
    weigh(10, true);
  }

  let score = Math.round((earned / possible) * 100);
  if (hard.length > 0) score = Math.min(score, 39);

  return { score, hardConflicts: hard, matches: good, cautions: caution };
}
