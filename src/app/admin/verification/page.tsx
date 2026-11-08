import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ASSESSMENT_ITEMS, IDENTITY_METHODS, OWNERSHIP_DOCS } from "@/lib/domain";
import { label, pick } from "@/lib/labels";
import { getDb } from "@/server/db";
import { currentActor, requireAdmin } from "@/server/session";
import {
  clearIdentityChecked, clearOwnershipReviewed, recordInspection, setIdentityChecked, setOwnershipReviewed,
} from "@/server/verification";

export const metadata: Metadata = { title: "Verification", robots: { index: false } };
export const dynamic = "force-dynamic";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const done = (slug: string) => revalidatePath(`/admin/verification?slug=${slug}`);

async function identity(f: FormData) {
  "use server";
  await requireAdmin();
  const db = getDb();
  if (s(f, "intent") === "clear") await clearIdentityChecked(db, await currentActor(), s(f, "userId"), s(f, "reason") || "cleared by admin").catch(() => undefined);
  else await setIdentityChecked(db, await currentActor(), s(f, "userId"), s(f, "method")).catch(() => undefined);
  done(s(f, "slug"));
}

async function ownership(f: FormData) {
  "use server";
  await requireAdmin();
  const db = getDb();
  if (s(f, "intent") === "clear") await clearOwnershipReviewed(db, await currentActor(), s(f, "listingId"), s(f, "reason") || "cleared by admin").catch(() => undefined);
  else await setOwnershipReviewed(db, await currentActor(), s(f, "listingId"), s(f, "docType")).catch(() => undefined);
  done(s(f, "slug"));
}

async function inspection(f: FormData) {
  "use server";
  await requireAdmin();
  await recordInspection(getDb(), await currentActor(), s(f, "listingId"), {
    inspectedAt: s(f, "inspectedAt"),
    verifiedItems: f.getAll("items").map(String),
    notes: s(f, "notes") || undefined,
  }).catch(() => undefined);
  done(s(f, "slug"));
}

export default async function Verification({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  await requireAdmin();
  const { slug } = await searchParams;
  const db = getDb();
  const listing = slug
    ? await db.listing.findUnique({
        where: { slug },
        select: {
          id: true, slug: true, title: true, area: true, ownerId: true, ownershipReviewedAt: true, ownershipDocType: true,
          owner: { select: { name: true, identityCheckedAt: true, identityMethod: true } },
          inspections: { orderBy: { inspectedAt: "desc" }, take: 3, select: { inspectedAt: true, verifiedItems: true, notes: true } },
        },
      })
    : null;
  const history = listing
    ? await db.auditLog.findMany({ where: { targetId: { in: [listing.id, listing.ownerId] } }, orderBy: { createdAt: "desc" }, take: 10, select: { action: true, detail: true, createdAt: true } })
    : [];

  const btn = "h-10 rounded-full border border-line-strong px-4 text-sm hover:bg-raised";
  const input = "h-10 rounded-xl border border-line bg-void px-3 text-sm";
  const box = "rounded-2xl border border-line bg-surface p-6";
  const date = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "not recorded");

  return (
    <main className="mx-auto max-w-4xl px-6 pb-28 pt-32">
      <p className="index">Admin</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Verification.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft">
        Three separate facts, recorded only after you have actually done them. Look at the document or the home, record the type and the date, and keep no copy. Never record a check you did not do. <Link href="/admin/reports" className="underline underline-offset-4">Back to reports</Link>
      </p>

      <form className="mt-10 flex flex-wrap gap-2" method="get">
        <input name="slug" defaultValue={slug} placeholder="Listing slug from its web address" aria-label="Listing slug" className={`${input} min-w-0 flex-1`} />
        <button className={btn}>Find</button>
      </form>
      {slug && !listing ? <p className="mt-6 text-sm text-danger">No listing with that slug.</p> : null}

      {listing ? (
        <div className="mt-10 space-y-6">
          <p className="font-display text-2xl font-semibold tracking-tight">{listing.title} <span className="font-mono text-xs font-normal text-faint">· {listing.area} · owner {listing.owner.name ?? listing.ownerId}</span></p>

          <section className={box}>
            <h2 className="index">1. Identity checked (the person)</h2>
            <p className="mt-2 text-sm text-soft">Now: {listing.owner.identityCheckedAt ? `checked ${date(listing.owner.identityCheckedAt)}, ${listing.owner.identityMethod?.toLowerCase().replace(/_/g, " ")}` : "not checked"}. Do not store ID numbers.</p>
            <form action={identity} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="slug" value={listing.slug} />
              <input type="hidden" name="userId" value={listing.ownerId} />
              <select name="method" className={input} aria-label="Method">
                {IDENTITY_METHODS.map((m) => <option key={m} value={m}>{m.toLowerCase().replace(/_/g, " ")}</option>)}
              </select>
              <button className={btn}>Record I checked</button>
              <input name="reason" placeholder="Reason, to clear" aria-label="Reason to clear" className={`${input} min-w-0 flex-1`} />
              <button name="intent" value="clear" className={`${btn} border-danger/40 text-danger`}>Clear</button>
            </form>
          </section>

          <section className={box}>
            <h2 className="index">2. Ownership documents reviewed (the home)</h2>
            <p className="mt-2 text-sm text-soft">Now: {listing.ownershipReviewedAt ? `${pick(label.ownershipDoc, listing.ownershipDocType ?? "")} reviewed ${date(listing.ownershipReviewedAt)}` : "not reviewed"}. This is not a legal title check.</p>
            <form action={ownership} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="slug" value={listing.slug} />
              <input type="hidden" name="listingId" value={listing.id} />
              <select name="docType" className={input} aria-label="Document type">
                {OWNERSHIP_DOCS.map((d) => <option key={d} value={d}>{pick(label.ownershipDoc, d)}</option>)}
              </select>
              <button className={btn}>Record I reviewed</button>
              <input name="reason" placeholder="Reason, to clear" aria-label="Reason to clear" className={`${input} min-w-0 flex-1`} />
              <button name="intent" value="clear" className={`${btn} border-danger/40 text-danger`}>Clear</button>
            </form>
          </section>

          <section className={box}>
            <h2 className="index">3. Property physically inspected</h2>
            <ul className="mt-2 space-y-1 text-sm text-soft">
              {listing.inspections.length === 0 ? <li>No inspection recorded. No inspection badge is shown.</li> : null}
              {listing.inspections.map((i) => <li key={i.inspectedAt.toISOString()}>{date(i.inspectedAt)}: {i.verifiedItems.length} items verified{i.notes ? `. ${i.notes}` : ""}</li>)}
            </ul>
            <form action={inspection} className="mt-4 space-y-4">
              <input type="hidden" name="slug" value={listing.slug} />
              <input type="hidden" name="listingId" value={listing.id} />
              <label className="block text-sm text-soft">Date you visited
                <input type="date" name="inspectedAt" required max={new Date().toISOString().slice(0, 10)} className={`${input} mt-2 block`} />
              </label>
              <fieldset>
                <legend className="mb-2 text-sm text-soft">Tick only the items you saw and checked yourself</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ASSESSMENT_ITEMS.map((item) => (
                    <label key={item} className="flex items-center gap-3 py-1 text-sm text-soft">
                      <input type="checkbox" name="items" value={item} className="size-4 accent-[var(--color-lamp)]" />
                      {pick(label.security, item)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <input name="notes" maxLength={1000} placeholder="Notes (optional)" aria-label="Notes" className={`${input} w-full`} />
              <button className={btn}>Record inspection</button>
            </form>
          </section>

          <section className={box}>
            <h2 className="index">Recent admin actions on this listing and owner</h2>
            <ul className="mt-2 space-y-1 font-mono text-xs text-faint">
              {history.length === 0 ? <li>None.</li> : null}
              {history.map((h) => <li key={h.createdAt.toISOString() + h.action}>{h.createdAt.toISOString().slice(0, 16).replace("T", " ")} · {h.action}{h.detail ? ` · ${h.detail}` : ""}</li>)}
            </ul>
          </section>
        </div>
      ) : null}
    </main>
  );
}
