import Link from "next/link";
import { ASSESSMENT_ITEMS } from "@/lib/domain";
import { label, pick } from "@/lib/labels";

type Status = "VERIFIED" | "DECLARED" | "NONE";

const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const STATUS_TEXT: Record<Status, string> = {
  VERIFIED: "Verified by platform",
  DECLARED: "Declared by landlord",
  NONE: "Not available / not verified",
};

/**
 * The property safety assessment. Each of the 13 items shows one of three statuses and never a mixture.
 * "Verified by platform" appears only when a person recorded a physical inspection with a date.
 * Declared items are the landlord's word. Missing items stay visible so a woman can see what to ask about.
 */
export function SafetyAssessment({
  declared,
  inspection,
  cctvLocations,
  cctvAccess,
}: {
  declared: string[];
  inspection: { inspectedAt: Date; verifiedItems: string[] } | null;
  cctvLocations: string | null;
  cctvAccess: string | null;
}) {
  const verified = new Set(inspection?.verifiedItems ?? []);
  const status = (item: string): Status => (verified.has(item) ? "VERIFIED" : declared.includes(item) ? "DECLARED" : "NONE");
  const counts = { VERIFIED: 0, DECLARED: 0, NONE: 0 };
  for (const item of ASSESSMENT_ITEMS) counts[status(item)] += 1;

  return (
    <section aria-labelledby="assessment" className="rounded-2xl border border-line p-6">
      <h2 id="assessment" className="index">Property safety assessment</h2>
      <p className="mt-3 text-sm text-soft">
        {inspection
          ? `Inspected in person on ${fmt(inspection.inspectedAt)}. ${counts.VERIFIED} of ${ASSESSMENT_ITEMS.length} items verified, ${counts.DECLARED} declared by the landlord, ${counts.NONE} not available or not verified.`
          : `No physical inspection yet. Everything below is what the landlord declared. ${counts.DECLARED} of ${ASSESSMENT_ITEMS.length} items declared.`}
      </p>
      <ul className="mt-5 divide-y divide-line">
        {ASSESSMENT_ITEMS.map((item) => {
          const s = status(item);
          return (
            <li key={item} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className={s === "NONE" ? "text-faint" : "text-text"}>{pick(label.security, item)}</span>
              <span
                className={`shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase ${
                  s === "VERIFIED" ? "bg-lime text-void" : s === "DECLARED" ? "border border-line-strong text-soft" : "text-faint"
                }`}
              >
                {STATUS_TEXT[s]}
              </span>
            </li>
          );
        })}
        {declared.includes("FEMALE_CARETAKER") ? (
          <li className="flex items-center justify-between gap-4 py-2.5 text-sm">
            <span>{pick(label.security, "FEMALE_CARETAKER")}</span>
            <span className="rounded-md border border-line-strong px-2 py-1 font-mono text-[10px] uppercase text-soft">{STATUS_TEXT.DECLARED}</span>
          </li>
        ) : null}
      </ul>

      {declared.includes("CCTV") ? (
        <div className="mt-5 rounded-xl border border-line bg-surface p-4 text-sm">
          <p className="font-medium text-text">Cameras in common areas</p>
          <dl className="mt-2 space-y-1 text-soft">
            <div><dt className="inline text-faint">Where: </dt><dd className="inline">{cctvLocations ?? "Not stated"}</dd></div>
            <div><dt className="inline text-faint">Who can see recordings: </dt><dd className="inline">{cctvAccess ?? "Not stated"}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-faint">The landlord confirmed there are no cameras in bedrooms, bathrooms or any private space. Report hidden cameras straight away.</p>
        </div>
      ) : (
        <p className="mt-5 text-xs text-faint">No cameras declared. Cameras are never allowed in bedrooms, bathrooms or other private spaces.</p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-faint">
        A listing is never called “safe”. Ask about anything not verified before you go, and read the <Link href="/safety/women" className="underline underline-offset-4">guide for women</Link>.
      </p>
    </section>
  );
}
