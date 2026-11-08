import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "@/lib/domain";
import { label, pick } from "@/lib/labels";
import { scamSignals } from "@/lib/safety";
import { checkText } from "@/lib/textGuard";
import { getDb } from "@/server/db";
import { decideAppeal, resolveReport, startReview } from "@/server/incidents";
import { getNotifier } from "@/server/notify";
import { currentActor, requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Reports", robots: { index: false } };
export const dynamic = "force-dynamic";

async function review(f: FormData) {
  "use server";
  await requireAdmin();
  await startReview(getDb(), getNotifier(), await currentActor(), String(f.get("id") ?? "")).catch(() => undefined);
  revalidatePath("/admin/reports");
}

async function resolve(f: FormData) {
  "use server";
  await requireAdmin();
  const outcome = String(f.get("outcome") ?? "") === "ACTION" ? "ACTION" : "DISMISS";
  await resolveReport(getDb(), getNotifier(), await currentActor(), String(f.get("id") ?? ""), { outcome, note: String(f.get("note") ?? "") }).catch(() => undefined);
  revalidatePath("/admin/reports");
}

async function decide(f: FormData) {
  "use server";
  await requireAdmin();
  const outcome = String(f.get("outcome") ?? "") === "UPHELD" ? "UPHELD" : "REJECTED";
  await decideAppeal(getDb(), getNotifier(), await currentActor(), String(f.get("id") ?? ""), { outcome, note: String(f.get("note") ?? "") }).catch(() => undefined);
  revalidatePath("/admin/reports");
}

async function approveFlagged(f: FormData) {
  "use server";
  await requireAdmin();
  const id = String(f.get("id") ?? "");
  const actor = await currentActor();
  await getDb().listing.updateMany({ where: { id }, data: { flagged: false } });
  if (actor) await getDb().auditLog.create({ data: { actorId: actor.id, action: "HOLD_RELEASED", targetType: "LISTING", targetId: id } });
  revalidatePath("/admin/reports");
}

const SEVERITY_TONE: Record<string, string> = {
  CRITICAL: "bg-danger text-void",
  HIGH: "bg-lamp text-void",
  MEDIUM: "border border-line-strong text-soft",
};

export default async function AdminReports() {
  await requireAdmin();
  const db = getDb();
  const [reports, appeals, flagged] = await Promise.all([
    db.report.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      orderBy: [{ severity: "asc" }, { createdAt: "asc" }],
      take: PAGE_SIZE * 2,
      select: { id: true, targetType: true, targetId: true, category: true, severity: true, status: true, details: true, incidentAt: true, createdAt: true, snapshot: true },
    }),
    db.appeal.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      take: PAGE_SIZE,
      select: { id: true, message: true, createdAt: true, report: { select: { category: true, targetType: true, targetId: true, resolutionNote: true } } },
    }),
    db.listing.findMany({
      where: { flagged: true, status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { createdAt: "asc" },
      take: PAGE_SIZE,
      select: { id: true, title: true, description: true, locationStatus: true, status: true },
    }),
  ]);

  const btn = "h-9 rounded-full border border-line-strong px-4 text-sm hover:bg-raised";
  const field = "h-9 min-w-0 flex-1 rounded-xl border border-line bg-void px-3 text-sm";

  return (
    <main className="mx-auto max-w-4xl px-6 pb-28 pt-32">
      <p className="index">Admin</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Reports.</h1>
      <p className="mt-4 text-sm text-soft">
        A report is a reason to look, not a finding. Critical and high reports pause a listing as a precaution. Decide, record why, and the reporter is told the outcome.{" "}
        <Link href="/admin/verification" className="underline underline-offset-4">Verification and inspections</Link>
      </p>

      <h2 className="index mt-14">Open reports, most serious first</h2>
      <ul className="mt-4 space-y-3">
        {reports.length === 0 ? <li className="text-sm text-faint">Nothing open.</li> : null}
        {reports.map((r) => (
          <li key={r.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-md px-2 py-1 font-mono text-[11px] uppercase ${SEVERITY_TONE[r.severity] ?? ""}`}>{r.severity.toLowerCase()}</span>
              <span className="font-mono text-xs text-faint">{pick(label.reportCategory, r.category)} · {r.targetType.toLowerCase()} · {r.status.toLowerCase().replace("_", " ")}</span>
            </div>
            <p className="mt-2 font-mono text-xs text-faint">
              filed {r.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              {r.incidentAt ? ` · incident ${r.incidentAt.toISOString().slice(0, 16).replace("T", " ")}` : ""} · target {r.targetId}
            </p>
            {r.details ? <p className="mt-3 text-[15px] text-soft">{r.details}</p> : null}
            {r.snapshot ? (
              <details className="mt-3 rounded-xl border border-line p-3">
                <summary className="cursor-pointer text-sm text-soft">Saved copy at the time of the report</summary>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-faint">{JSON.stringify(JSON.parse(r.snapshot), null, 2)}</pre>
              </details>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {r.status === "OPEN" ? (
                <form action={review}><input type="hidden" name="id" value={r.id} /><button className={btn}>Start review</button></form>
              ) : null}
            </div>
            <form action={resolve} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={r.id} />
              <input name="note" required minLength={3} maxLength={500} placeholder="Reason, recorded in the audit log" aria-label="Reason" className={field} />
              <button name="outcome" value="ACTION" className={`${btn} border-danger/40 text-danger`}>Take action</button>
              <button name="outcome" value="DISMISS" className={btn}>Dismiss</button>
            </form>
          </li>
        ))}
      </ul>

      <h2 className="index mt-14">Appeals</h2>
      <ul className="mt-4 space-y-3">
        {appeals.length === 0 ? <li className="text-sm text-faint">No appeals waiting.</li> : null}
        {appeals.map((a) => (
          <li key={a.id} className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-mono text-xs text-faint">{pick(label.reportCategory, a.report.category)} · {a.report.targetType.toLowerCase()} {a.report.targetId}</p>
            <p className="mt-3 text-[15px] text-soft">{a.message}</p>
            <form action={decide} className="mt-4 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={a.id} />
              <input name="note" required minLength={3} maxLength={500} placeholder="Reason" aria-label="Reason" className={field} />
              <button name="outcome" value="UPHELD" className={btn}>Uphold appeal, lift hold</button>
              <button name="outcome" value="REJECTED" className={btn}>Reject</button>
            </form>
          </li>
        ))}
      </ul>

      <h2 id="held" className="index mt-14 scroll-mt-24">Held listings (wording, location, or paused after a report)</h2>
      <ul className="mt-4 space-y-3">
        {flagged.length === 0 ? <li className="text-sm text-faint">Nothing held.</li> : null}
        {flagged.map((l) => (
          <li key={l.id} className="rounded-2xl border border-line bg-surface p-5">
            <p className="font-display text-lg font-semibold tracking-tight">{l.title} <span className="font-mono text-xs font-normal text-faint">· {l.status.toLowerCase()}</span></p>
            <p className="mt-2 text-sm text-soft">{l.description}</p>
            <p className="mt-2 font-mono text-xs text-lamp">
              {[
                ...checkText(`${l.title} ${l.description}`).matches.map((m) => `${m.category}: ${m.term}`),
                ...scamSignals(`${l.title} ${l.description}`),
                ...(l.locationStatus === "FAR_FROM_AREA" ? ["pin is far from the chosen area"] : []),
              ].join(" · ") || "Held after reports"}
            </p>
            <form action={approveFlagged} className="mt-4"><input type="hidden" name="id" value={l.id} /><button className={btn}>Release hold</button></form>
          </li>
        ))}
      </ul>
    </main>
  );
}
