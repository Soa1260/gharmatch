import { describe, expect, it } from "vitest";
import { canInvite, containsContactInfo, toBoardView, type InviterProfile } from "./safety";

describe("containsContactInfo", () => {
  it("accepts a normal message", () => {
    expect(containsContactInfo("Hi, I work at Infosys Gift City and need a 2 BHK from December for 12 months.")).toBe(false);
  });
  it("catches phone numbers in several shapes", () => {
    expect(containsContactInfo("call 98765 43210")).toBe(true);
    expect(containsContactInfo("9 8 7 6 5 4 3 2 1 0")).toBe(true);
    expect(containsContactInfo("+91-98765-43210")).toBe(true);
    expect(containsContactInfo("nine eight seven six five four three two one zero")).toBe(true);
  });
  it("catches emails, links and handles", () => {
    expect(containsContactInfo("me at asha@example.com")).toBe(true);
    expect(containsContactInfo("asha (at) example (dot) com")).toBe(true);
    expect(containsContactInfo("see wa.me/9198")).toBe(true);
    expect(containsContactInfo("dm @asha_k")).toBe(true);
    expect(containsContactInfo("whatsapp 98")).toBe(true);
  });
  it("does not mistake rent and deposit figures for a phone number", () => {
    expect(containsContactInfo("Rent 18000 deposit 40000, maintenance 1500")).toBe(false);
    expect(containsContactInfo("Deposit 1,20,000 and rent 25,000")).toBe(false);
  });
  it("allows rent figures and short numbers", () => {
    expect(containsContactInfo("Budget 18000, deposit 2 months")).toBe(false);
  });
});

const landlord: InviterProfile = {
  id: "l1", emailVerified: true, hasPhoneOnFile: true, banned: false,
  activeListingCount: 1, invitesSentToday: 0, blockedByTarget: false,
};
const target = { group: "WOMEN" as const, acceptsInvites: true, ownerId: "t1" };

describe("canInvite", () => {
  it("allows a verified landlord with a listing and a phone on file", () => {
    expect(canInvite(landlord, target).allowed).toBe(true);
  });
  it("blocks unverified email, no listing, banned and blocked inviters", () => {
    expect(canInvite({ ...landlord, emailVerified: false }, target).allowed).toBe(false);
    expect(canInvite({ ...landlord, activeListingCount: 0 }, target).allowed).toBe(false);
    expect(canInvite({ ...landlord, banned: true }, target).allowed).toBe(false);
    expect(canInvite({ ...landlord, blockedByTarget: true }, target).allowed).toBe(false);
  });
  it("respects tenants who turned invites off", () => {
    expect(canInvite(landlord, { ...target, acceptsInvites: false }).allowed).toBe(false);
  });
  it("requires a phone on file for women or mixed groups but not for men", () => {
    const noPhone = { ...landlord, hasPhoneOnFile: false };
    expect(canInvite(noPhone, target).allowed).toBe(false);
    expect(canInvite(noPhone, { ...target, group: "MIXED" }).allowed).toBe(false);
    expect(canInvite(noPhone, { ...target, group: "MEN" }).allowed).toBe(true);
  });
  it("uses a lower daily cap for women", () => {
    expect(canInvite({ ...landlord, invitesSentToday: 3 }, target).allowed).toBe(false);
    expect(canInvite({ ...landlord, invitesSentToday: 3 }, { ...target, group: "MEN" }).allowed).toBe(true);
  });
});

describe("toBoardView", () => {
  const base = {
    id: "r1", group: "MEN" as const, city: "AHMEDABAD", areas: ["Bopal"], budgetMin: 14200, budgetMax: 18400,
    moveInDate: new Date("2026-12-10"), tenantType: "BACHELORS", diet: "NON_VEG",
    intro: "Software engineer, quiet.", acceptsInvites: true, tenantName: "Rohan Kumar Verma",
  };
  it("shows a first name and the intro for men", () => {
    const v = toBoardView(base);
    expect(v.displayName).toBe("Rohan");
    expect(v.intro).toBe("Software engineer, quiet.");
  });
  it("hides name and intro when women are involved", () => {
    for (const group of ["WOMEN", "MIXED"] as const) {
      const v = toBoardView({ ...base, group, tenantName: "Asha Rao" });
      expect(v.displayName).toBe("Verified tenant");
      expect(v.intro).toBeNull();
      expect(JSON.stringify(v)).not.toContain("Asha");
    }
  });
  it("rounds the budget instead of exposing the exact figure", () => {
    expect(toBoardView(base).budgetBand).toBe("₹14,000 to ₹18,000");
  });
});
