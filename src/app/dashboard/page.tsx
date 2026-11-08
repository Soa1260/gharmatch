import type { Metadata } from "next";
import Link from "next/link";
import {
  blockAction, cancelVisitAction, checkInAction, checkOutAction, listingStatusAction, requirementStatusAction, respondAction, withdrawAction,
} from "@/app/actions";
import { AgreedRulesCard } from "@/components/dashboard/AgreedRulesCard";
import { AppealForm, TrustedShare, VisitConfirm, VisitPlanner } from "@/components/dashboard/VisitForms";
import { EmergencyStrip } from "@/components/site/EmergencyStrip";
import { PAGE_SIZE } from "@/lib/domain";
import { inr, label, pick } from "@/lib/labels";
import { mapsOpenUrl } from "@/lib/location";
import { getContactsForInterest, getLocationForInterest, type Contact, type ExactLocation } from "@/server/contacts";
import { getDb } from "@/server/db";
import { listAppealable } from "@/server/incidents";
import { getAgreedRules, listMyInterests } from "@/server/interests";
import type { AgreedRules } from "@/server/matchSnapshot";
import { listMine } from "@/server/listings";
import { listVisits } from "@/server/visits";
import { requireOnboarded } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };
export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const daysUntil = (d: Date) => Math.ceil((d.getTime() - Date.now()) / DAY);

function Btn({ children, tone = "ghost" }: { children: React.ReactNode; tone?: "solid" | "ghost" | "danger" }) {
  const cls = tone === "solid" ? "bg-text text-void" : tone === "danger" ? "border border-danger/40 text-danger" : "border border-line-strong text-text hover:bg-raised";
  return <button className={`h-9 rounded-full px-4 text-sm transition-colors ${cls}`}>{children}</button>;
}

function StatusTag({ status }: { status: string }) {
  const tone = status === "ACCEPTED" ? "bg-lime text-void" : status === "PENDING" ? "bg-lamp text-void" : "border border-line text-faint";
  return <span className={`rounded-md px-2.5 py-1 font-mono text-[11px] uppercase ${tone}`}>{status.toLowerCase()}</span>;
}

export default async function Dashboard() {
  const me = await requireOnboarded("/dashboard");
  const db = getDb();
  const actor = { id: me.id };

  const [listings, searches, received, sent] = await Promise.all([
    me.isLandlord ? listMine(db, actor) : Promise.resolve([]),
    me.isTenant
      ? db.requirement.findMany({
          where: { tenantId: me.id, status: { not: "DELETED" } },
          orderBy: { createdAt: "desc" },
          take: PAGE_SIZE,
          select: { id: true, city: true, areas: true, budgetMax: true, status: true, occupantGroup: true },
        })
      : Promise.resolve([]),
    listMyInterests(db, actor, "received"),
    listMyInterests(db, actor, "sent"),
  ]);

  const contacts = new Map<string, Contact>();
  await Promise.all(
    [...received, ...sent]
      .filter((i) => i.status === "ACCEPTED")
      .map(async (i) => {
        const c = await getContactsForInterest(db, actor, i.id).catch(() => null);
        if (c) contacts.set(i.id, c);
      }),
  );

  const allInterests = [...received, ...sent];
  const locations = new Map<string, ExactLocation>();
  await Promise.all(
    allInterests
      .filter((i) => i.status === "ACCEPTED" && i.viewerIsTenant)
      .map(async (i) => {
        const loc = await getLocationForInterest(db, actor, i.id).catch(() => null);
        if (loc) locations.set(i.id, loc);
      }),
  );
  const agreedRules = new Map<string, AgreedRules>();
  await Promise.all(
    allInterests
      .filter((i) => i.status === "ACCEPTED")
      .map(async (i) => {
        const a = await getAgreedRules(db, actor, i.id).catch(() => null);
        if (a) agreedRules.set(i.id, a);
      }),
  );
  const [visits, appealable] = await Promise.all([listVisits(db, actor), listAppealable(db, actor)]);
  const fmtWhen = (dt: Date) => dt.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const womenInvolved = searches.some((s) => s.occupantGroup !== "MEN");
  const row = "flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5";

  return (
    <main className="mx-auto max-w-5xl px-6 pb-28 pt-32">
      <p className="index">Dashboard</p>
      <h1 className="display mt-4 text-5xl sm:text-7xl">Hi, {me.name?.split(" ")[0] ?? "there"}.</h1>
      <div className="mt-8 flex flex-wrap gap-3">
        {me.isLandlord ? <Link href="/listings/new" className="inline-flex h-11 items-center rounded-full bg-text px-6 text-sm font-medium text-void">Post a home</Link> : null}
        {me.isLandlord ? <Link href="/board" className="inline-flex h-11 items-center rounded-full border border-line-strong px-6 text-sm">People looking</Link> : null}
        {me.isTenant ? <Link href="/searches/new" className="inline-flex h-11 items-center rounded-full border border-line-strong px-6 text-sm">Post a search</Link> : null}
      </div>

      {womenInvolved ? (
        <section className="mt-12 rounded-2xl border border-line bg-surface p-6">
          <h2 className="index">Your safety tools</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-soft">You appear to landlords as “Verified tenant”, with no name or intro, until you reply. Landlords can only invite you if they are verified and have a phone on file.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/account" className="rounded-full border border-line-strong px-4 py-2 hover:bg-raised">Set a trusted contact</Link>
            <Link href="/safety/women" className="rounded-full border border-line-strong px-4 py-2 hover:bg-raised">Guide for women</Link>
            <Link href="/help" className="rounded-full border border-danger/50 px-4 py-2 text-danger">Need help now</Link>
          </div>
        </section>
      ) : null}

      <section className="mt-16">
        <h2 className="index">Needs your reply</h2>
        <ul className="mt-4 space-y-3">
          {received.filter((i) => i.status === "PENDING").length === 0 ? <li className="text-sm text-faint">Nothing waiting.</li> : null}
          {received.filter((i) => i.status === "PENDING").map((i) => (
            <li key={i.id} className={row}>
              <div className="max-w-md">
                <p className="font-display text-lg font-semibold tracking-tight">{i.origin === "TENANT" ? `${i.tenant.displayName} on “${i.listing.title}”` : `Invitation for “${i.listing.title}”`}</p>
                <p className="mt-1 font-mono text-xs text-faint">{i.tenant.budgetBand} · {i.tenant.tenantType.toLowerCase()} · {i.tenant.diet.toLowerCase().replace("_", "-")}</p>
                <p className="mt-3 text-[15px] text-soft">“{i.message}”</p>
                {i.tenant.intro ? <p className="mt-2 text-sm text-faint">{i.tenant.intro}</p> : null}
              </div>
              <div className="flex gap-2">
                <form action={respondAction}><input type="hidden" name="interestId" value={i.id} /><input type="hidden" name="decision" value="ACCEPT" /><Btn tone="solid">Accept</Btn></form>
                <form action={respondAction}><input type="hidden" name="interestId" value={i.id} /><input type="hidden" name="decision" value="DECLINE" /><Btn>Decline</Btn></form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="index">Accepted: contact details</h2>
        <ul className="mt-4 space-y-3">
          {contacts.size === 0 ? <li className="text-sm text-faint">Contacts appear here after an interest is accepted.</li> : null}
          {[...contacts.entries()].map(([id, c]) => (
            <li key={id} className={row}>
              <div>
                <p className="font-display text-lg font-semibold tracking-tight">{c.name ?? "Contact"}</p>
                <p className="mt-1 font-mono text-sm text-soft">{c.phone ?? "No phone given"} · {c.email}</p>
              </div>
              <form action={blockAction}><input type="hidden" name="userId" value={c.userId} /><Btn tone="danger">Block</Btn></form>
              {locations.get(id) ? (
                <div className="w-full rounded-xl border border-line p-4 text-sm">
                  <p className="index">Exact address</p>
                  <p className="mt-2 text-text">{locations.get(id)?.addressLine ?? "Address not given"}</p>
                  <a href={mapsOpenUrl({ lat: locations.get(id)!.lat, lng: locations.get(id)!.lng })} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex h-9 items-center rounded-full bg-text px-4 text-sm font-medium text-void">
                    Open in Google Maps
                  </a>
                </div>
              ) : null}
              {agreedRules.get(id) ? <AgreedRulesCard agreed={agreedRules.get(id)!} /> : null}
              {allInterests.find((x) => x.id === id)?.viewerIsTenant ? <div className="w-full"><VisitPlanner interestId={id} /></div> : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-faint">Never pay a deposit before you have visited in person. Meet at the gate first, and tell someone you trust.</p>
        {contacts.size > 0 ? <EmergencyStrip compact className="mt-4" /> : null}
      </section>

      <section className="mt-16">
        <h2 className="index">Visits</h2>
        <ul className="mt-4 space-y-3">
          {visits.length === 0 ? <li className="text-sm text-faint">No visits yet. After a landlord accepts, plan a visit from the accepted card.</li> : null}
          {visits.map((v) => (
            <li key={v.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/listings/${v.listing.slug}`} className="font-display text-lg font-semibold tracking-tight hover:underline">{v.listing.title}</Link>
                  <p className="mt-1 font-mono text-xs text-faint">{fmtWhen(v.scheduledAt)} · {v.listing.area} · {v.asTenant ? "you" : v.visitor}{v.companion ? " · bringing someone" : ""}</p>
                  {v.representativeName ? <p className="mt-2 text-sm text-soft">You will meet {v.representativeName} ({String(v.representativeRole ?? "").toLowerCase().replace("_", " ")}).</p> : <p className="mt-2 text-sm text-faint">Waiting for the owner to name who will meet you.</p>}
                  {v.note ? <p className="mt-1 text-sm text-faint">“{v.note}”</p> : null}
                </div>
                <StatusTag status={v.status} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {v.asTenant && v.status === "CONFIRMED" ? <form action={checkInAction}><input type="hidden" name="visitId" value={v.id} /><Btn tone="solid">I have arrived</Btn></form> : null}
                {v.asTenant && v.status === "CHECKED_IN" ? (
                  <>
                    <form action={checkOutAction}><input type="hidden" name="visitId" value={v.id} /><Btn tone="solid">I have left safely</Btn></form>
                    <TrustedShare label="Message" text={`I have reached the visit for ${v.listing.title} in ${v.listing.area}. I will message again when I leave.`} />
                  </>
                ) : null}
                {v.asTenant && (v.status === "CONFIRMED" || v.status === "REQUESTED") ? (
                  <TrustedShare label="Share plan with" text={`I am visiting a home in ${v.listing.area} on ${fmtWhen(v.scheduledAt)}${v.representativeName ? `, meeting ${v.representativeName}` : ""}. Please call me if you do not hear from me within an hour.`} />
                ) : null}
                {v.status === "CONFIRMED" || v.status === "REQUESTED" ? <a href={`/api/visits/${v.id}/ics`} className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-sm hover:bg-raised">Add to calendar</a> : null}
                {v.status === "CONFIRMED" || v.status === "REQUESTED" ? <form action={cancelVisitAction}><input type="hidden" name="visitId" value={v.id} /><Btn>Cancel</Btn></form> : null}
              </div>
              {!v.asTenant && v.status === "REQUESTED" ? <VisitConfirm visitId={v.id} /> : null}
              {v.asTenant && v.status === "CHECKED_IN" ? <p className="mt-3 text-xs text-faint">If you feel unsafe, leave and call 112. These messages are not an emergency or police service.</p> : null}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-faint">Check-in and check-out are for you and the person you choose to tell. Gharmatch does not watch them and cannot send help.</p>
      </section>

      {appealable.filter((r) => r.status !== "DISMISSED").length > 0 ? (
        <section className="mt-16">
          <h2 className="index">Safety reports about you</h2>
          <p className="mt-3 max-w-xl text-sm text-soft">A report was filed and your listing or search may be paused while a person reviews it. A report is not a finding. You can tell us your side, and we do not share who reported.</p>
          <ul className="mt-4 space-y-3">
            {appealable.filter((r) => r.status !== "DISMISSED").map((r) => (
              <li key={r.id} className={row + " block"}>
                <p className="text-sm text-text">{pick(label.reportCategory, r.category)} <span className="font-mono text-xs text-faint">· {r.status.toLowerCase().replace("_", " ")}</span></p>
                {r.appeal ? <p className="mt-2 text-sm text-faint">Your appeal is {r.appeal.status.toLowerCase()}.</p> : <AppealForm reportId={r.id} />}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {me.isLandlord ? (
        <section className="mt-16">
          <h2 className="index">Your homes</h2>
          <ul className="mt-4 space-y-3">
            {listings.length === 0 ? <li className="text-sm text-faint">No homes yet.</li> : null}
            {listings.map((l) => {
              const daysLeft = daysUntil(l.expiresAt);
              const needsConfirm = l.status === "EXPIRED" || (l.status === "ACTIVE" && daysLeft <= 5);
              return (
                <li key={l.id} className={row}>
                  <div>
                    <Link href={`/listings/${l.slug}`} className="font-display text-lg font-semibold tracking-tight hover:underline">{l.title}</Link>
                    <p className="mt-1 font-mono text-xs text-faint">{inr(l.rent)} · {l.area} · {l.status.toLowerCase()}{l.flagged ? " · under review" : ""}{l.status === "ACTIVE" ? ` · ${Math.max(daysLeft, 0)} days left` : ""}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {needsConfirm ? <form action={listingStatusAction}><input type="hidden" name="listingId" value={l.id} /><input type="hidden" name="confirm" value="yes" /><Btn tone="solid">Still available</Btn></form> : null}
                    <Link href={`/listings/${l.slug}/edit`} className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-sm hover:bg-raised">Edit and photos</Link>
                    <form action={listingStatusAction}><input type="hidden" name="listingId" value={l.id} /><input type="hidden" name="status" value={l.status === "PAUSED" ? "ACTIVE" : "PAUSED"} /><Btn>{l.status === "PAUSED" ? "Resume" : "Pause"}</Btn></form>
                    <form action={listingStatusAction}><input type="hidden" name="listingId" value={l.id} /><input type="hidden" name="status" value="DELETED" /><Btn tone="danger">Delete</Btn></form>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {me.isTenant ? (
        <section className="mt-16">
          <h2 className="index">Your searches</h2>
          <ul className="mt-4 space-y-3">
            {searches.length === 0 ? <li className="text-sm text-faint">No searches yet.</li> : null}
            {searches.map((s) => (
              <li key={s.id} className={row}>
                <p className="font-display text-lg font-semibold tracking-tight">{s.areas.slice(0, 3).join(", ")} <span className="font-mono text-xs font-normal text-faint">up to {inr(s.budgetMax)} · {s.status.toLowerCase()}</span></p>
                <div className="flex gap-2">
                  <Link href={`/searches/${s.id}/edit`} className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-sm hover:bg-raised">Edit</Link>
                  <form action={requirementStatusAction}><input type="hidden" name="requirementId" value={s.id} /><input type="hidden" name="status" value={s.status === "PAUSED" ? "ACTIVE" : "PAUSED"} /><Btn>{s.status === "PAUSED" ? "Resume" : "Pause"}</Btn></form>
                  <form action={requirementStatusAction}><input type="hidden" name="requirementId" value={s.id} /><input type="hidden" name="status" value="DELETED" /><Btn tone="danger">Delete</Btn></form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-16 text-sm text-faint"><Link href="/account" className="underline underline-offset-4">Account and data</Link></p>

      <section className="mt-16">
        <h2 className="index">Sent</h2>
        <ul className="mt-4 space-y-3">
          {sent.length === 0 ? <li className="text-sm text-faint">Nothing sent yet.</li> : null}
          {sent.map((i) => (
            <li key={i.id} className={row}>
              <div>
                <Link href={`/listings/${i.listing.slug}`} className="font-display text-lg font-semibold tracking-tight hover:underline">{i.listing.title}</Link>
                <p className="mt-1 text-sm text-faint">“{i.message}”</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusTag status={i.status} />
                {i.status === "PENDING" ? <form action={withdrawAction}><input type="hidden" name="interestId" value={i.id} /><Btn>Withdraw</Btn></form> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
