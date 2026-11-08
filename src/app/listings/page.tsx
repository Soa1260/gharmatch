import type { Metadata } from "next";
import { Suspense } from "react";
import { BrowseFilters } from "@/components/listing/BrowseFilters";
import { ListingGrid } from "@/components/listing/ListingGrid";
import type { ListingCardData } from "@/components/listing/ListingCard";
import { Button } from "@/components/ui/Button";
import { CITIES, type City } from "@/lib/domain";
import { FILTER_GROUPS, parseMulti } from "@/lib/filters";
import { sampleListings } from "@/lib/sampleListings";
import { getDb } from "@/server/db";
import { photoUrls } from "@/server/storage";
import { browseListings } from "@/server/listings";

export const metadata: Metadata = {
  title: "Homes for rent in Ahmedabad and Gandhinagar",
  description: "Browse rentals by area, rent and house rules. See the fit before you send interest. No broker fee.",
};

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
};

async function load(sp: Search): Promise<{ items: ListingCardData[]; sample: boolean }> {
  const cityParam = one(sp.city);
  const city = (CITIES as readonly string[]).includes(cityParam ?? "") ? (cityParam as City) : undefined;
  const multi = Object.fromEntries(FILTER_GROUPS.map((g) => [g.param, parseMulti(sp[g.param], g.values)]));
  const filters = {
    city,
    area: one(sp.area),
    bhk: num(one(sp.bhk)),
    maxRent: num(one(sp.max)),
    genderPolicy: multi.for,
    tenantTypes: multi.type,
    dietPolicy: multi.diet,
    furnishing: multi.furn,
    security: multi.sec,
    pets: multi.pets,
    parking: multi.park,
  };

  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    const items = sampleListings.filter(
      (l) =>
        (!filters.city || l.city === filters.city) &&
        (!filters.area || l.area === filters.area) &&
        (!filters.bhk || (filters.bhk === 3 ? l.bhk >= 3 : l.bhk === filters.bhk)) &&
        (!filters.maxRent || l.rent <= filters.maxRent) &&
        (!filters.genderPolicy?.length || filters.genderPolicy.includes(l.genderPolicy)) &&
        (!filters.tenantTypes?.length || l.tenantTypes.some((t) => filters.tenantTypes?.includes(t))) &&
        (!filters.dietPolicy?.length || filters.dietPolicy.includes(l.dietPolicy)) &&
        (!filters.furnishing?.length || filters.furnishing.includes(l.furnishing)) &&
        (!filters.security?.length || filters.security.every((s) => l.securityFeatures.includes(s))) &&
        (!filters.pets?.length || filters.pets.includes(l.pets)) &&
        (!filters.parking?.length || filters.parking.includes(l.parking)),
    );
    return { items, sample: true };
  }
  const page = await browseListings(getDb(), filters);
  const items = page.items.map((l) => ({ ...l, photos: photoUrls(l.photos.map((x) => x.objectKey)) }));
  return { items, sample: false };
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const { items, sample } = await load(sp);

  return (
    <main className="mx-auto max-w-6xl px-6 pb-28 pt-32">
      <h1 className="display text-5xl sm:text-8xl">Homes for rent</h1>
      <p className="mt-4 max-w-xl text-[17px] text-soft">
        Rules are written by the landlord. Open a home to see how it fits your search before you send interest.
      </p>
      <div className="mt-10">
        <Suspense>
          <BrowseFilters />
        </Suspense>
      </div>
      <div className="mt-12">
        {items.length > 0 ? (
          <ListingGrid key={JSON.stringify(sp)} items={items} sample={sample} />
        ) : (
          <div className="rounded-3xl border border-line px-8 py-20 text-center">
            <p className="text-xl font-light tracking-tight">No homes match these filters yet.</p>
            <p className="mx-auto mt-3 max-w-md text-sm text-soft">
              Loosen a filter, or post what you are looking for and let landlords come to you.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href="/signin?role=tenant" variant="ghost">Post what you need</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
