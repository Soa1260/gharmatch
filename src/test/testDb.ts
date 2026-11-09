import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { createClient, type Db } from "@/server/db";

/** Every migration, in order, so tests run against the same schema as production. */
const dir = path.resolve(process.cwd(), "prisma/migrations");
const migrations = readdirSync(dir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()
  .map((name) => readFileSync(path.join(dir, name, "migration.sql"), "utf8"));

export async function createTestDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const pg = new PGlite();
  for (const sql of migrations) await pg.exec(sql);
  const db = createClient(new PrismaPGlite(pg));
  return {
    db,
    close: async () => {
      await db.$disconnect();
      await pg.close();
    },
  };
}

let counter = 0;

type UserOverrides = Partial<{
  name: string;
  isLandlord: boolean;
  isTenant: boolean;
  phone: string | null;
  verified: boolean;
  status: "ACTIVE" | "BANNED" | "DELETED";
}>;

export async function makeUser(db: Db, over: UserOverrides = {}) {
  counter += 1;
  return db.user.create({
    data: {
      email: `user${counter}@example.test`,
      name: over.name ?? `User ${counter}`,
      phone: over.phone === undefined ? "9876543210" : over.phone,
      isLandlord: over.isLandlord ?? false,
      isTenant: over.isTenant ?? false,
      emailVerified: over.verified === false ? null : new Date(),
      status: over.status ?? "ACTIVE",
    },
    select: { id: true },
  });
}

export const validListing = {
  title: "Bright 2 BHK near Bopal Cross Road",
  city: "AHMEDABAD",
  area: "Bopal",
  rent: 20000,
  deposit: 40000,
  bhk: 2,
  furnishing: "SEMI_FURNISHED",
  availableFrom: new Date(Date.now() + 10 * 86_400_000),
  description: "Second floor flat with a balcony, lift and covered parking in a quiet lane.",
  dietPolicy: "NO_RESTRICTION",
  tenantTypes: ["FAMILY", "BACHELORS", "WORKING_WOMEN"],
  genderPolicy: "ANY",
  securityFeatures: ["CCTV", "ENTRANCE_SECURITY"],
  cctvLocations: "Main gate and parking",
  cctvAccess: "Society committee only",
  noPrivateCameras: true,
  mapsLink: "23.0302, 72.4711",
  addressLine: "Flat 301, Sunrise Heights, Bopal",
  keyHolders: "TENANT_ONLY",
  ownerAccess: "WITH_NOTICE",
  noticeHours: 24,
  pets: "CASE_BY_CASE",
  smoking: "OUTDOORS_ONLY",
  alcohol: "NOT_ALLOWED",
  visitors: "DAYTIME_ONLY",
  minLeaseMonths: 11,
  noticeDays: 30,
  parking: "TWO_WHEELER",
  wfhAllowed: true,
  maxOccupants: 3,
  postedBy: "OWNER",
  declareAuthorised: true,
};

export const validRequirement = {
  city: "AHMEDABAD",
  areas: ["Bopal"],
  budgetMin: 15000,
  budgetMax: 22000,
  moveInDate: new Date(Date.now() + 15 * 86_400_000),
  tenantType: "BACHELORS",
  occupantGroup: "MEN",
  diet: "NON_VEG",
  hasPets: false,
  smokes: false,
  drinks: false,
  needsSecurity: false,
  acceptsInvites: true,
  durationMonths: 12,
  occupants: 2,
  intro: "Software engineer, quiet, works from the office most days.",
};
