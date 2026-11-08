import { label, pick } from "@/lib/labels";

const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Row({ title, on, detail, limit }: { title: string; on: boolean; detail: string; limit: string }) {
  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-4">
        <span className={`text-sm ${on ? "text-text" : "text-faint"}`}>{title}</span>
        <span className={`shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase ${on ? "bg-lime text-void" : "text-faint"}`}>{on ? "Done" : "Not yet"}</span>
      </div>
      <p className="mt-1 text-xs text-faint">{on ? detail : "Nobody on our team has recorded this."} {limit}</p>
    </li>
  );
}

/**
 * Three separate checks, never merged into one badge. Each says what it covers and what it does not.
 * There is no “Verified landlord” and no “safe” label anywhere.
 */
export function TrustIndicators({
  identityCheckedAt,
  identityMethod,
  ownershipReviewedAt,
  ownershipDocType,
  inspectedAt,
}: {
  identityCheckedAt: Date | null;
  identityMethod: string | null;
  ownershipReviewedAt: Date | null;
  ownershipDocType: string | null;
  inspectedAt: Date | null;
}) {
  return (
    <section aria-labelledby="checks" className="rounded-2xl border border-line p-6">
      <h2 id="checks" className="index">What has been checked</h2>
      <ul className="mt-2 divide-y divide-line">
        <Row
          title="Identity checked"
          on={Boolean(identityCheckedAt)}
          detail={`Photo ID seen ${identityMethod === "PHOTO_ID_SEEN_ON_VIDEO" ? "on a video call" : "in person"} on ${identityCheckedAt ? fmt(identityCheckedAt) : ""}. No ID number is kept.`}
          limit="This is about the person, not the property."
        />
        <Row
          title="Ownership documents reviewed"
          on={Boolean(ownershipReviewedAt)}
          detail={`A ${pick(label.ownershipDoc, ownershipDocType ?? "")} was reviewed on ${ownershipReviewedAt ? fmt(ownershipReviewedAt) : ""}. The document is not kept.`}
          limit="This is not a legal title check."
        />
        <Row
          title="Property physically inspected"
          on={Boolean(inspectedAt)}
          detail={`Visited in person on ${inspectedAt ? fmt(inspectedAt) : ""}. See the assessment for which items were seen.`}
          limit="An inspection is a snapshot on that date."
        />
      </ul>
    </section>
  );
}
