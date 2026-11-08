import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingForm, type ListingValues } from "@/components/form/ListingForm";
import { PhotoManager } from "@/components/form/PhotoManager";
import { getDb } from "@/server/db";
import { listOwnPhotos } from "@/server/photos";
import { requireOnboarded } from "@/server/session";
import { getStorage } from "@/server/storage";
import type { City } from "@/lib/domain";

export const metadata: Metadata = { title: "Edit your home", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditListing({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const me = await requireOnboarded(`/listings/${slug}/edit`);
  const l = await getDb().listing.findFirst({ where: { slug, ownerId: me.id, status: { not: "DELETED" } } });
  if (!l) notFound();

  const storage = getStorage();
  const photos = storage ? (await listOwnPhotos(getDb(), { id: me.id }, l.id)).map((p) => ({ id: p.id, url: storage.urlFor(p.objectKey) })) : [];

  const initial: ListingValues = {
    id: l.id, title: l.title, city: l.city as City, area: l.area, rent: l.rent, deposit: l.deposit, bhk: l.bhk,
    furnishing: l.furnishing, availableFrom: l.availableFrom.toISOString().slice(0, 10), description: l.description,
    dietPolicy: l.dietPolicy, tenantTypes: l.tenantTypes, genderPolicy: l.genderPolicy, securityFeatures: l.securityFeatures,
    pets: l.pets, smoking: l.smoking, alcohol: l.alcohol, visitors: l.visitors, quietHours: l.quietHours,
    minLeaseMonths: l.minLeaseMonths, noticeDays: l.noticeDays, parking: l.parking, wfhAllowed: l.wfhAllowed, maxOccupants: l.maxOccupants,
    mapsLink: l.lat != null && l.lng != null ? `${l.lat}, ${l.lng}` : "", addressLine: l.addressLine ?? "",
    cctvLocations: l.cctvLocations, cctvAccess: l.cctvAccess, occupancyNote: l.occupancyNote,
    ownerLivesOnSite: l.ownerLivesOnSite, keyHolders: l.keyHolders, ownerAccess: l.ownerAccess, noticeHours: l.noticeHours,
  };

  return (
    <main className="mx-auto max-w-4xl px-6 pb-28 pt-32">
      <Link href={`/listings/${l.slug}`} className="index hover:text-text">← Back to the listing</Link>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Edit your home.</h1>

      <section className="mt-12">
        <h2 className="index">Photos</h2>
        <div className="mt-4"><PhotoManager listingId={l.id} initial={photos} enabled={Boolean(storage)} /></div>
      </section>

      <ListingForm initial={initial} />
    </main>
  );
}
