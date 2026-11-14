import type { Metadata } from "next";
import Link from "next/link";
import { RecordsLookup } from "@/components/form/RecordsLookup";
import { getDb } from "@/server/db";
import { listDeletedWhileReported, listRecentLookups } from "@/server/records";
import { currentActor, requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Account records", robots: { index: false } };
export const dynamic = "force-dynamic";

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "unknown");

export default async function AdminRecords() {
  await requireAdmin();
  const actor = await currentActor();
  const [deleted, lookups] = await Promise.all([listDeletedWhileReported(getDb(), actor), listRecentLookups(getDb(), actor)]);

  return (
    <main className="mx-auto max-w-3xl px-6 pb-28 pt-32">
      <Link href="/admin" className="index hover:text-text">← Admin</Link>
      <h1 className="display mt-4 text-5xl sm:text-6xl">Account records.</h1>
      <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-soft">
        See the name, email and phone behind an account, for a safety report or a lawful request only. Every lookup needs a written reason and is saved with your account and the time. Nothing here is sent to anyone.
      </p>

      <RecordsLookup />

      <section className="mt-16">
        <h2 className="index">Deleted while a report was open or upheld ({deleted.length})</h2>
        <ul className="mt-3 space-y-1 font-mono text-xs text-soft">
          {deleted.length === 0 ? <li className="font-sans text-sm text-faint">None.</li> : null}
          {deleted.map((d) => <li key={d.id}>{d.id} · deleted {when(d.deletedAt)}</li>)}
        </ul>
        <p className="mt-3 max-w-xl text-sm text-faint">Their name, email and phone are gone. Paste an id above to see the reports and homes that remain. A return under the same email is noted on the new account.</p>
      </section>

      <section className="mt-12">
        <h2 className="index">Latest lookups</h2>
        <ul className="mt-3 space-y-2 text-sm text-soft">
          {lookups.length === 0 ? <li className="text-faint">No lookups yet.</li> : null}
          {lookups.map((l) => <li key={l.at + l.account}>{when(l.at)} · {l.by} looked at {l.account} · {l.reason}</li>)}
        </ul>
      </section>
    </main>
  );
}
