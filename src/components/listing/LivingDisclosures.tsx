import { label, pick } from "@/lib/labels";

/**
 * What a tenant needs to know about living here: who else is there, who holds keys, when the owner may enter.
 * These are the landlord's declarations. Unauthorized entry can be reported from this page.
 */
export function LivingDisclosures({
  ownerLivesOnSite,
  occupancyNote,
  keyHolders,
  ownerAccess,
  noticeHours,
  visitors,
}: {
  ownerLivesOnSite: boolean;
  occupancyNote: string | null;
  keyHolders: string;
  ownerAccess: string;
  noticeHours: number;
  visitors: string;
}) {
  const rows: Array<[string, string]> = [
    ["Owner on site", ownerLivesOnSite ? "The owner or family lives in the same building" : "The owner does not live on site"],
    ["Who else lives here", occupancyNote ?? "Nothing more declared"],
    ["Duplicate keys", pick(label.keyHolders, keyHolders)],
    ["Owner access", `${pick(label.ownerAccess, ownerAccess)}${ownerAccess === "WITH_NOTICE" ? `, at least ${noticeHours} hours before` : ""}`],
    ["Visitors", pick(label.visitors, visitors)],
  ];
  return (
    <section aria-labelledby="living" className="rounded-2xl border border-line p-6">
      <h2 id="living" className="index">Living here</h2>
      <dl className="mt-4 divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="grid gap-1 py-3 text-[15px] sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className="text-faint">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-faint">These are the landlord&apos;s declarations. Get them written into the rental agreement. If someone enters without permission, report it and call 112 if you are in danger.</p>
    </section>
  );
}
