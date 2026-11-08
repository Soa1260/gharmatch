import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/site/Prose";
import { DIRECTORY, STATUS_TEXT } from "@/lib/directory";

export const metadata: Metadata = {
  title: "Emergency and support directory",
  description: "Helplines and women's support services for Ahmedabad and Gandhinagar, with the source and check date for each entry.",
};

const TONE = {
  CHECKED: "bg-lime text-void",
  CHECKED_OLD_SOURCE: "bg-lamp text-void",
  NOT_YET_CHECKED: "border border-line-strong text-soft",
} as const;

export default function Directory() {
  return (
    <Page index="Help" title="Support directory.">
      <p className="text-lg text-text">
        In danger? Call <a href="tel:112">112</a>. The services below are run by government agencies, not by Gharmatch. We list them and link to the source so you can check for yourself.
      </p>
      <p>
        Each entry says what we did: read it on an official page, found it only on an old page, or have not checked it yet. Numbers can change, so confirm before you rely on them.
      </p>

      <ul className="!ml-0 space-y-4 !list-none">
        {DIRECTORY.map((e) => (
          <li key={e.name} className="!ml-0 !list-none rounded-2xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-xl font-semibold tracking-tight text-text">{e.name}</p>
              <span className={`rounded-md px-2 py-1 font-mono text-[10px] uppercase ${TONE[e.status]}`}>{STATUS_TEXT[e.status]}</span>
            </div>
            {e.number ? (
              <p className="mt-2 font-mono text-3xl text-text">
                <a href={`tel:${e.number}`} className="!no-underline">{e.number}</a>
              </p>
            ) : null}
            <p className="mt-2 text-[15px]">{e.what}</p>
            <p className="mt-2 text-xs text-faint">Run by: {e.operator}</p>
            {e.source ? (
              <p className="mt-1 text-xs text-faint">
                Source: <a href={e.source.url} target="_blank" rel="noopener noreferrer">{e.source.label}</a>
                {e.source.pageDate ? ` · ${e.source.pageDate}` : ""}
                {e.checkedOn ? ` · we read it on ${e.checkedOn}` : ""}
              </p>
            ) : null}
            {e.caution ? <p className="mt-2 text-xs text-lamp">{e.caution}</p> : null}
          </li>
        ))}
      </ul>

      <h2>Police stations and hospitals near a home</h2>
      <p>
        We do not keep our own list, because a stale list is worse than none. Every listing has “Police station nearby” and “Hospital nearby” links that open a live Google Maps search around the area. Always check the route and the hours yourself.
      </p>

      <h2>Before launch</h2>
      <ul>
        <li>Confirm every entry marked “not yet checked” or “out of date” with the issuing office, and add the local police control room numbers for Ahmedabad and Gandhinagar.</li>
        <li>Replace the old Ahmedabad district page entries when a newer official list is available.</li>
        <li>Repeat the check at least every three months and update the date.</li>
      </ul>
      <p>
        Back to the <Link href="/help">help page</Link>.
      </p>
    </Page>
  );
}
