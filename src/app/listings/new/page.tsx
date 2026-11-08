import type { Metadata } from "next";
import { ListingForm } from "@/components/form/ListingForm";
import { getDb } from "@/server/db";
import { requireOnboarded } from "@/server/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Post your home", robots: { index: false } };

export default async function NewListing() {
  const user = await requireOnboarded("/listings/new");
  if (!user.isLandlord) redirect("/onboarding?next=/listings/new");
  // A landlord with no number on file adds one first; the service refuses to publish without it as well.
  const withPhone = await getDb().user.findUnique({ where: { id: user.id }, select: { phone: true } });
  if (!withPhone?.phone) redirect("/onboarding?next=/listings/new");
  return (
    <main className="mx-auto max-w-4xl px-6 pb-28 pt-32">
      <p className="index">New listing</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Post your home.</h1>
      <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-soft">
        Write the rules the way you would tell a friend. Food, pets, visitors, lease. Describe the home, never the tenant.
      </p>
      <ListingForm />
    </main>
  );
}
