import { inr, label, pick } from "@/lib/labels";
import type { AgreedRules } from "@/server/matchSnapshot";

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/**
 * What the home's rules were at the moment this match was accepted. Both people see the same saved copy, so a
 * later edit to the listing cannot change what was agreed. Shown on the dashboard; Gharmatch does not judge
 * disputes (see the Terms), it only keeps this record.
 */
export function AgreedRulesCard({ agreed }: { agreed: AgreedRules }) {
  const r = agreed.rules;
  const d = agreed.disclosures;
  const rows: Array<[string, string]> = [
    ["Rent and deposit", `${inr(agreed.listing.rent)} a month, deposit ${inr(agreed.listing.deposit)}`],
    ["Food", pick(label.diet, r.diet)],
    ["Who can rent", r.tenantTypes.map((t) => pick(label.tenantType, t)).join(", ")],
    ["Pets", pick(label.pets, r.pets)],
    ["Smoking", pick(label.habit, r.smoking)],
    ["Alcohol", pick(label.habit, r.alcohol)],
    ["Visitors", `${pick(label.visitors, r.visitors)}${r.quietHours ? `, quiet hours ${r.quietHours}` : ""}`],
    ["Lease", `${r.minLeaseMonths} months minimum, ${r.noticeDays} days notice, up to ${r.maxOccupants} people`],
    ["Duplicate keys", pick(label.keyHolders, d.keyHolders)],
    ["Owner entry", `${pick(label.ownerAccess, d.ownerAccess)}${d.ownerAccess === "WITH_NOTICE" ? `, at least ${d.noticeHours} hours before` : ""}`],
    ["Owner on site", d.ownerLivesOnSite ? "Owner or family lives in the same building" : "Owner does not live on site"],
    ["Cameras", d.cctvLocations ? `${d.cctvLocations}. Recordings seen by: ${d.cctvAccess ?? "not stated"}` : "None declared"],
  ];
  return (
    <details className="w-full rounded-xl border border-line p-4 text-sm">
      <summary className="cursor-pointer index">Rules agreed at acceptance, saved {when(agreed.acceptedAt)}</summary>
      <dl className="mt-4 divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-2 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="text-faint">{k}</dt>
            <dd className="text-soft">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-faint">
        This is the home as declared by the landlord when you matched. If the listing is edited later, this copy stays the same. Gharmatch keeps it as a neutral record and does not decide disputes.
      </p>
    </details>
  );
}
