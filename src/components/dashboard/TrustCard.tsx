import { trustLines, type ScreeningEntry, type TenantTrust } from "@/lib/trust";

const tone = { good: "text-text", plain: "text-soft", warn: "text-danger" } as const;
const mark = { good: "✓", plain: "·", warn: "!" } as const;

/** What the landlord knows about the person who wrote, and their answers to the landlord's questions. Facts only. */
export function TrustCard({ trust, screening }: { trust: TenantTrust | null; screening: ScreeningEntry[] }) {
  if (!trust && screening.length === 0) return null;
  return (
    <div className="mt-4 space-y-4 rounded-xl border border-line p-4 text-sm">
      {screening.length > 0 ? (
        <div>
          <p className="index">Their answers</p>
          <dl className="mt-2 space-y-2">
            {screening.map((s) => (
              <div key={s.q}>
                <dt className="text-faint">{s.q}</dt>
                <dd className="text-text">{s.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
      {trust ? (
        <div>
          <p className="index">About this account</p>
          <ul className="mt-2 space-y-1">
            {trustLines(trust).map((l) => (
              <li key={l.text} className={tone[l.tone]}>
                <span aria-hidden className="mr-2 font-mono">{mark[l.tone]}</span>
                {l.text}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">These are facts about the account, not a judgement of the person. Most good tenants are new here.</p>
        </div>
      ) : null}
    </div>
  );
}
