import { describe, expect, it } from "vitest";
import { matchListing, type ListingFacts, type RequirementFacts } from "./matching";

const listing: ListingFacts = {
  city: "AHMEDABAD",
  area: "Bopal",
  rent: 20000,
  availableFrom: new Date("2026-12-01"),
  dietPolicy: "NO_RESTRICTION",
  tenantTypes: ["FAMILY", "BACHELORS", "WORKING_WOMEN"],
  pets: "ALLOWED",
  smoking: "OUTDOORS_ONLY",
  alcohol: "NOT_ALLOWED",
  minLeaseMonths: 11,
  maxOccupants: 3,
  genderPolicy: "ANY",
  securityFeatures: ["CCTV"],
};

const requirement: RequirementFacts = {
  city: "AHMEDABAD",
  areas: ["Bopal"],
  budgetMax: 22000,
  moveInDate: new Date("2026-12-05"),
  tenantType: "BACHELORS",
  diet: "NON_VEG",
  hasPets: false,
  smokes: false,
  drinks: false,
  durationMonths: 12,
  occupants: 2,
  occupantGroup: "MEN",
  needsSecurity: false,
};

describe("matchListing", () => {
  it("scores a clean match at 100 with no conflicts", () => {
    const r = matchListing(requirement, listing);
    expect(r.score).toBe(100);
    expect(r.hardConflicts).toEqual([]);
  });

  it("reports a veg-only listing as a hard conflict for a non-veg tenant", () => {
    const r = matchListing(requirement, { ...listing, dietPolicy: "VEG_ONLY" });
    expect(r.hardConflicts.map((c) => c.code)).toContain("diet");
    expect(r.score).toBeLessThan(40);
  });

  it("allows egg eaters in a veg-or-egg home but not non-veg", () => {
    const eggOnly = { ...listing, dietPolicy: "EGG_ONLY" as const };
    expect(matchListing({ ...requirement, diet: "EGG" }, eggOnly).hardConflicts).toEqual([]);
    expect(matchListing(requirement, eggOnly).hardConflicts.map((c) => c.code)).toContain("diet");
  });

  it("flags rent above budget", () => {
    const r = matchListing(requirement, { ...listing, rent: 30000 });
    expect(r.hardConflicts.map((c) => c.code)).toContain("budget");
  });

  it("treats a different city as a hard conflict", () => {
    const r = matchListing(requirement, { ...listing, city: "GANDHINAGAR", area: "Kudasan" });
    expect(r.hardConflicts.map((c) => c.code)).toContain("city");
  });

  it("gives partial credit for a neighbouring area and none for a distant one", () => {
    const near = matchListing(requirement, { ...listing, area: "Shela" });
    const far = matchListing(requirement, { ...listing, area: "Naroda" });
    expect(near.score).toBeGreaterThan(far.score);
    expect(near.hardConflicts).toEqual([]);
  });

  it("flags pets, smoking and alcohol conflicts", () => {
    const r = matchListing(
      { ...requirement, hasPets: true, drinks: true },
      { ...listing, pets: "NOT_ALLOWED" },
    );
    const codes = r.hardConflicts.map((c) => c.code);
    expect(codes).toContain("pets");
    expect(codes).toContain("alcohol");
  });

  it("flags occupant and lease limits", () => {
    const r = matchListing({ ...requirement, occupants: 5, durationMonths: 6 }, listing);
    const codes = r.hardConflicts.map((c) => c.code);
    expect(codes).toContain("occupants");
    expect(codes).toContain("lease");
  });

  it("flags a household type the listing does not accept", () => {
    const r = matchListing({ ...requirement, tenantType: "STUDENTS" }, listing);
    expect(r.hardConflicts.map((c) => c.code)).toContain("tenantType");
  });

  it("warns, without a hard conflict, when the home opens after the move-in date", () => {
    const r = matchListing({ ...requirement, moveInDate: new Date("2026-11-01") }, listing);
    expect(r.hardConflicts).toEqual([]);
    expect(r.cautions.map((c) => c.code)).toContain("moveIn");
  });
});

describe("matchListing: occupant group and security", () => {
  it("treats a women-only home as a hard conflict for men and mixed groups", () => {
    const womenOnly = { ...listing, genderPolicy: "WOMEN_ONLY" as const };
    expect(matchListing(requirement, womenOnly).hardConflicts.map((c) => c.code)).toContain("occupantGroup");
    expect(matchListing({ ...requirement, occupantGroup: "MIXED" }, womenOnly).hardConflicts.map((c) => c.code)).toContain("occupantGroup");
    expect(matchListing({ ...requirement, occupantGroup: "WOMEN" }, womenOnly).hardConflicts).toEqual([]);
  });
  it("treats a men-only home as a hard conflict for women", () => {
    const r = matchListing({ ...requirement, occupantGroup: "WOMEN" }, { ...listing, genderPolicy: "MEN_ONLY" });
    expect(r.hardConflicts.map((c) => c.code)).toContain("occupantGroup");
  });
  it("cautions, without blocking, when security is needed but not listed", () => {
    const r = matchListing({ ...requirement, needsSecurity: true }, { ...listing, securityFeatures: [] });
    expect(r.hardConflicts).toEqual([]);
    expect(r.cautions.map((c) => c.code)).toContain("security");
  });
  it("credits listed security features", () => {
    const r = matchListing({ ...requirement, needsSecurity: true }, listing);
    expect(r.matches.map((c) => c.code)).toContain("security");
    expect(r.score).toBe(100);
  });
});
