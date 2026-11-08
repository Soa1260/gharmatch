/**
 * The record behind the dispute steps in the Terms: when an interest is accepted we save the home's house rules
 * and disclosures exactly as they stood. If the listing is edited later, both people can still see what was agreed.
 * It holds no phone, email or exact address.
 */
export interface AgreedRules {
  version: 1;
  acceptedAt: string;
  listing: { title: string; city: string; area: string; rent: number; deposit: number; bhk: number; furnishing: string; availableFrom: string };
  rules: {
    diet: string; tenantTypes: string[]; genderPolicy: string; pets: string; smoking: string; alcohol: string;
    visitors: string; quietHours: string | null; minLeaseMonths: number; noticeDays: number; maxOccupants: number;
    parking: string; wfhAllowed: boolean;
  };
  disclosures: {
    securityFeatures: string[]; cctvLocations: string | null; cctvAccess: string | null; ownerLivesOnSite: boolean;
    occupancyNote: string | null; keyHolders: string; ownerAccess: string; noticeHours: number;
  };
  firstMessage: string;
}

export interface SnapshotSource {
  title: string; city: string; area: string; rent: number; deposit: number; bhk: number; furnishing: string; availableFrom: Date;
  dietPolicy: string; tenantTypes: string[]; genderPolicy: string; pets: string; smoking: string; alcohol: string; visitors: string;
  quietHours: string | null; minLeaseMonths: number; noticeDays: number; maxOccupants: number; parking: string; wfhAllowed: boolean;
  securityFeatures: string[]; cctvLocations: string | null; cctvAccess: string | null; ownerLivesOnSite: boolean;
  occupancyNote: string | null; keyHolders: string; ownerAccess: string; noticeHours: number;
}

export function buildAgreedRules(l: SnapshotSource, firstMessage: string, acceptedAt: Date): AgreedRules {
  return {
    version: 1,
    acceptedAt: acceptedAt.toISOString(),
    listing: { title: l.title, city: l.city, area: l.area, rent: l.rent, deposit: l.deposit, bhk: l.bhk, furnishing: l.furnishing, availableFrom: l.availableFrom.toISOString() },
    rules: {
      diet: l.dietPolicy, tenantTypes: l.tenantTypes, genderPolicy: l.genderPolicy, pets: l.pets, smoking: l.smoking, alcohol: l.alcohol,
      visitors: l.visitors, quietHours: l.quietHours, minLeaseMonths: l.minLeaseMonths, noticeDays: l.noticeDays, maxOccupants: l.maxOccupants,
      parking: l.parking, wfhAllowed: l.wfhAllowed,
    },
    disclosures: {
      securityFeatures: l.securityFeatures, cctvLocations: l.cctvLocations, cctvAccess: l.cctvAccess, ownerLivesOnSite: l.ownerLivesOnSite,
      occupancyNote: l.occupancyNote, keyHolders: l.keyHolders, ownerAccess: l.ownerAccess, noticeHours: l.noticeHours,
    },
    firstMessage,
  };
}

export function parseAgreedRules(raw: string | null): AgreedRules | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as AgreedRules;
    return v && v.version === 1 ? v : null;
  } catch {
    return null;
  }
}
