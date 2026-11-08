import type { ListingCardData } from "@/components/listing/ListingCard";

export interface SampleListing extends ListingCardData {
  tenantTypes: string[];
  pets: string;
  parking: string;
}

const base = { photos: [], artSlides: 3 };

/**
 * Development-only placeholders so the browse page can be reviewed without a database.
 * Never rendered in production, and every card is labelled "Sample". Slides are generated art, not photos.
 */
export const sampleListings: SampleListing[] = [
  { ...base, slug: "sample-bopal-2bhk", title: "2 BHK near Bopal Cross Road", area: "Bopal", city: "AHMEDABAD", rent: 20000, bhk: 2, furnishing: "SEMI_FURNISHED", dietPolicy: "NO_RESTRICTION", genderPolicy: "ANY", securityFeatures: ["BUILDING_ACCESS_CONTROL", "CCTV"], tenantTypes: ["FAMILY", "BACHELORS"], pets: "CASE_BY_CASE", parking: "BOTH" },
  { ...base, slug: "sample-thaltej-1bhk", title: "1 BHK in Thaltej", area: "Thaltej", city: "AHMEDABAD", rent: 16500, bhk: 1, furnishing: "FURNISHED", dietPolicy: "VEG_ONLY", genderPolicy: "WOMEN_ONLY", securityFeatures: ["ENTRANCE_SECURITY", "FEMALE_CARETAKER"], tenantTypes: ["WORKING_WOMEN", "STUDENTS"], pets: "NOT_ALLOWED", parking: "TWO_WHEELER" },
  { ...base, slug: "sample-kudasan-3bhk", title: "3 BHK in Kudasan", area: "Kudasan", city: "GANDHINAGAR", rent: 24000, bhk: 3, furnishing: "UNFURNISHED", dietPolicy: "NON_VEG_ALLOWED", genderPolicy: "ANY", securityFeatures: ["BUILDING_ACCESS_CONTROL"], tenantTypes: ["FAMILY"], pets: "ALLOWED", parking: "FOUR_WHEELER" },
  { ...base, slug: "sample-satellite-2bhk", title: "2 BHK in Satellite", area: "Satellite", city: "AHMEDABAD", rent: 28000, bhk: 2, furnishing: "FURNISHED", dietPolicy: "EGG_ONLY", genderPolicy: "ANY", securityFeatures: ["CCTV", "INTERCOM"], tenantTypes: ["FAMILY", "SHARING"], pets: "CASE_BY_CASE", parking: "BOTH" },
  { ...base, slug: "sample-sargasan-1bhk", title: "1 BHK in Sargasan", area: "Sargasan", city: "GANDHINAGAR", rent: 14000, bhk: 1, furnishing: "SEMI_FURNISHED", dietPolicy: "NO_RESTRICTION", genderPolicy: "MEN_ONLY", securityFeatures: [], tenantTypes: ["BACHELORS", "STUDENTS", "SHARING"], pets: "NOT_ALLOWED", parking: "NONE" },
  { ...base, slug: "sample-shela-2bhk", title: "2 BHK in Shela", area: "Shela", city: "AHMEDABAD", rent: 18500, bhk: 2, furnishing: "SEMI_FURNISHED", dietPolicy: "NO_RESTRICTION", genderPolicy: "ANY", securityFeatures: ["BUILDING_ACCESS_CONTROL", "ENTRANCE_SECURITY"], tenantTypes: ["FAMILY", "BACHELORS", "WORKING_WOMEN"], pets: "ALLOWED", parking: "TWO_WHEELER" },
];
