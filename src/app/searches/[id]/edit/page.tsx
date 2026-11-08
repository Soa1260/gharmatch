import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SearchForm, type SearchValues } from "@/components/form/SearchForm";
import type { City } from "@/lib/domain";
import { getDb } from "@/server/db";
import { requireOnboarded } from "@/server/session";

export const metadata: Metadata = { title: "Edit your search", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditSearch({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireOnboarded(`/searches/${id}/edit`);
  const r = await getDb().requirement.findFirst({ where: { id, tenantId: me.id, status: { not: "DELETED" } } });
  if (!r) notFound();

  const initial: SearchValues = {
    id: r.id, occupantGroup: r.occupantGroup, tenantType: r.tenantType, city: r.city as City, occupants: r.occupants,
    areas: r.areas, budgetMin: r.budgetMin, budgetMax: r.budgetMax, moveInDate: r.moveInDate.toISOString().slice(0, 10),
    durationMonths: r.durationMonths, diet: r.diet, hasPets: r.pets === "YES", smokes: r.smoking === "YES",
    drinks: r.alcohol === "YES", needsSecurity: r.needsSecurity, acceptsInvites: r.acceptsInvites, intro: r.intro,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-32">
      <Link href="/dashboard" className="index hover:text-text">← Back to dashboard</Link>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Edit your search.</h1>
      <SearchForm initial={initial} />
    </main>
  );
}
