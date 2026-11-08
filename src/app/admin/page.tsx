import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_SIZE } from "@/lib/domain";
import { scamSignals } from "@/lib/safety";
import { checkText } from "@/lib/textGuard";
import { getDb } from "@/server/db";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Entry point for the review team. Only emails in ADMIN_EMAILS with a verified address get past requireAdmin. */
export default async function Admin() {
  await requireAdmin();
  const db = getDb();
  const [open, held, users, listings] = await Promise.all([
    db.report.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    db.listing.findMany({
      where: { flagged: true, status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { createdAt: "asc" },
      take: PAGE_SIZE,
      select: { id: true, slug: true, title: true, description: true, locationStatus: true, status: true },
    }),
    db.user.count(),
    db.listing.count(),
  ]);

  const reason = (l: (typeof held)[number]) =>
    [
      ...checkText(`${l.title} ${l.description}`).matches.map((m) => `${m.category}: ${m.term}`),
      ...scamSignals(`${l.title} ${l.description}`),
      ...(l.locationStatus === "FAR_FROM_AREA" ? ["pin is far from the chosen area"] : []),
    ].join(" · ") || "Held after reports";

  const tiles = [
    { href: "/admin/reports", title: "Reports and held listings", note: `${open} open reports · ${held.length} held`, body: "Urgent and high-severity reports come first. Held listings are further down the same page, with Release hold." },
    { href: "/admin/verification", title: "Verification", note: "by listing", body: "Record identity checks, ownership documents and inspections. This does not release a held listing." },
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 pb-28 pt-32">
      <p className="index">Admin</p>
      <h1 className="display mt-4 text-5xl sm:text-6xl">Review desk.</h1>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-soft">
        {users} {users === 1 ? "person" : "people"}, {listings} {listings === 1 ? "listing" : "listings"}.
      </p>

      <h2 className="index mt-12">Waiting for a decision ({held.length})</h2>
      <ul className="mt-4 space-y-3">
        {held.length === 0 ? <li className="text-sm text-faint">Nothing held.</li> : null}
        {held.map((l) => (
          <li key={l.id} className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-display text-lg font-semibold tracking-tight">
              {l.title} <span className="font-mono text-xs font-normal text-faint">· {l.status.toLowerCase()}</span>
            </p>
            <p className="mt-2 font-mono text-xs text-lamp">{reason(l)}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link href="/admin/reports#held" className="underline underline-offset-4">Review and release</Link>
              <Link href={`/admin/verification?slug=${l.slug}`} className="text-soft underline underline-offset-4">Verification checks</Link>
              <Link href={`/listings/${l.slug}/edit`} className="text-soft underline underline-offset-4">Open the listing</Link>
            </div>
          </li>
        ))}
      </ul>

      <ul className="mt-12 grid gap-4 md:grid-cols-2">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="block h-full rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{t.title}</h2>
                <span className="font-mono text-xs uppercase text-faint">{t.note}</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-soft">{t.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
