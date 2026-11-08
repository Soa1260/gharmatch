export const label = {
  furnishing: { UNFURNISHED: "Unfurnished", SEMI_FURNISHED: "Semi-furnished", FURNISHED: "Furnished" },
  diet: {
    VEG_ONLY: "Veg only",
    EGG_ONLY: "Veg and egg",
    NON_VEG_ALLOWED: "Non-veg allowed",
    NO_RESTRICTION: "No food rules",
  },
  gender: { ANY: "Open to all", WOMEN_ONLY: "Women only", MEN_ONLY: "Men only" },
  pets: { ALLOWED: "Pets allowed", CASE_BY_CASE: "Pets: ask first", NOT_ALLOWED: "No pets" },
  habit: { ALLOWED: "Allowed", OUTDOORS_ONLY: "Outdoors only", NOT_ALLOWED: "Not allowed" },
  visitors: { FREE: "Visitors welcome", DAYTIME_ONLY: "Daytime visitors", LIMITED: "Limited visitors" },
  parking: { NONE: "No parking", TWO_WHEELER: "Two-wheeler parking", FOUR_WHEELER: "Car parking", BOTH: "Car and bike parking" },
  tenantType: {
    FAMILY: "Family",
    BACHELORS: "Bachelors",
    WORKING_WOMEN: "Working women",
    STUDENTS: "Students",
    SHARING: "Sharing",
  },
  security: {
    MAIN_DOOR_SECURITY: "Main-door security",
    DOOR_LOCKS: "Door locks and latches",
    WINDOW_SECURITY: "Window security",
    BALCONY_SECURITY: "Balcony security",
    ENTRANCE_SECURITY: "Entrance security",
    CCTV: "CCTV in common areas",
    COMMON_LIGHTING: "Common-area lighting",
    VISITOR_MANAGEMENT: "Visitor management",
    INTERCOM: "Intercom",
    EMERGENCY_EXITS: "Emergency exits",
    FIRE_SAFETY: "Fire safety",
    PARKING_SECURITY: "Parking security",
    BUILDING_ACCESS_CONTROL: "Building access control",
    FEMALE_CARETAKER: "Female caretaker",
  },
  keyHolders: {
    TENANT_ONLY: "Only the tenant has keys",
    OWNER: "Owner keeps a duplicate key",
    CARETAKER: "Caretaker keeps a duplicate key",
    OWNER_AND_CARETAKER: "Owner and caretaker keep duplicate keys",
  },
  ownerAccess: {
    WITH_NOTICE: "Owner enters only with advance notice",
    WITH_CONSENT: "Owner enters only with the tenant's consent",
    EMERGENCY_ONLY: "Owner enters only in an emergency",
  },
  ownershipDoc: {
    PROPERTY_TAX_RECEIPT: "municipal property-tax receipt",
    UTILITY_BILL: "utility bill",
    PROPERTY_CARD: "property card",
    AUTHORIZATION_LETTER: "authorization letter from the owner",
  },
  reportCategory: {
    NEED_HELP: "I need help now",
    PHYSICAL_THREAT_STALKING: "Physical threat or stalking",
    UNAUTHORIZED_ENTRY: "Someone entered without permission",
    LANDLORD_HARASSMENT: "Landlord harassment",
    UNDISCLOSED_SURVEILLANCE: "Hidden or undisclosed cameras",
    PROPERTY_SAFETY_VIOLATION: "Property is unsafe or not as described",
    SUSPICIOUS_REPRESENTATIVE: "Suspicious person acting for the owner",
    FINANCIAL_FRAUD: "Money fraud or asked for money early",
    OCCUPANCY_VIOLATION: "Who lives here is not as disclosed",
    DISCRIMINATION: "Discriminatory rules",
    OTHER: "Something else",
  },
} as const;

type Dict = Record<string, string>;
export function pick(dict: Dict, key: string): string {
  return dict[key] ?? key;
}

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
