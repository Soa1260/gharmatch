import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteForm } from "@/components/form/InviteForm";
import { ReportButton } from "@/components/listing/ReportButton";
import { CITIES, CITY_LABEL, type City } from "@/lib/domain";
import { label, pick } from "@/lib/labels";
import { getDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { listMine } from "@/server/listings";
import { listBoard } from "@/server/requirements";
import { requireOnboarded } from "@/server/session";

export const metadata: Metadata = { title: "People looking", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Board({ searchParams }: { searchParams: Promise<{ city?: string; cursor?: string }> }) {
  const sp = await searchParams;
  const me = await requireOnboarded("/board");
  if (!me.isLandlord) redirect("/onboarding?next=/board");

  const db = getDb();
  const city = (CITIES as readonly string[]).includes(sp.city ?? "") ? (sp.city as City) : undefined;
  let loaded;
  try {
    loaded = await Promise.all([listBoard(db, { id: me.id }, { city, cursor: sp.cursor }), listMine(db, { id: me.id })]);
  } catch (err) {
    if (!(err instanceof AppError) || err.code !== "FORBIDDEN") throw err;
    return (
      <main className="mx-auto max-w-3xl px-6 pb-28 pt-32">
        <p className="index">For landlords</p>
        <h1 className="display mt-4 text-5xl sm:text-6xl">Not yet.</h1>
        <p className="mt-5 text-[17px] leading-relaxed text-soft">{err.message}</p>
        <Link href="/dashboard" className="mt-8 inline-block text-sm underline underline-offset-4">Back to your dashboard</Link>
      </main>
    );
  }
  const [board, mine] = loaded;
  const active = mine.filter((l) => l.status === "ACTIVE").map((l) => ({ id: l.id, title: l.title }));

  return (
    <main className="mx-auto max-w-5xl px-6 pb-28 pt-32">
      <p className="index">For landlords</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">People looking.</h1>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-soft">
        Searches are shown without surnames or exact budgets. For women and mixed groups there is no name or intro at all until they reply. Invitations need a verified email, a live listing and a phone number on file.
      </p>
      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/board" className={`rounded-full border px-4 py-2 ${!city ? "border-transparent bg-text text-void" : "border-line text-soft"}`}>Both</Link>
        {CITIES.map((c) => (
          <Link key={c} href={`/board?city=${c}`} className={`rounded-full border px-4 py-2 ${city === c ? "border-transparent bg-text text-void" : "border-line text-soft"}`}>{CITY_LABEL[c]}</Link>
        ))}
      </div>

      {active.length === 0 ? <p className="mt-10 rounded-2xl border border-line p-6 text-sm text-soft">Post a home first, then you can invite people.</p> : null}
      <ul className="mt-10 grid gap-4 md:grid-cols-2">
        {board.items.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-surface p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-xl font-semibold tracking-tight">{r.displayName}</p>
              <span className="rounded-md border border-line px-2 py-1 font-mono text-[11px] uppercase text-faint">{r.group.toLowerCase()}</span>
            </div>
            <p className="mt-3 font-mono text-sm">{r.budgetBand}</p>
            <p className="mt-1 text-sm text-faint">{r.areas.join(", ")} · from {r.moveInMonth}</p>
            <p className="mt-3 text-sm text-soft">{pick(label.tenantType, r.tenantType)} · {r.diet.toLowerCase().replace("_", "-")}</p>
            {r.intro ? <p className="mt-3 text-[15px] text-soft">{r.intro}</p> : null}
            {active.length > 0 ? <InviteForm requirementId={r.id} listings={active} /> : null}
            <div className="mt-4"><ReportButton targetType="REQUIREMENT" targetId={r.id} /></div>
          </li>
        ))}
      </ul>
      {board.items.length === 0 ? <p className="mt-10 text-sm text-faint">No searches match yet.</p> : null}
      {board.nextCursor ? <Link href={`/board?${city ? `city=${city}&` : ""}cursor=${board.nextCursor}`} className="mt-10 inline-block text-sm underline underline-offset-4">Older searches</Link> : null}
    </main>
  );
}
