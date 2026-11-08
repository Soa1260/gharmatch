import Link from "next/link";
import { EMERGENCY } from "@/lib/emergency";

/**
 * Tap-to-call helplines. Plain links, so they work on any phone with no script.
 * Used inside text pages whose prose styles add bullets, indents and underlines to lists and links,
 * so each of those is switched off here with `!` rather than depending on where the strip is placed.
 * Two columns at most: the text column on those pages is narrow, and four cards would be cramped.
 */
export function EmergencyStrip({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <div className={`not-prose ${className}`}>
      <ul className="!ml-0 grid list-none gap-2 !p-0 sm:grid-cols-2">
        {EMERGENCY.map((e) => (
          <li key={e.number} className="!ml-0 !list-none">
            <a
              href={`tel:${e.number}`}
              className="flex h-full items-center gap-4 rounded-xl border border-danger/40 bg-danger/5 px-4 py-3 !no-underline transition-colors hover:bg-danger/10"
            >
              <span className="font-mono text-2xl font-medium text-danger">{e.number}</span>
              <span className="min-w-0">
                <span className="block text-sm text-text">{e.name}</span>
                {compact ? null : <span className="block text-xs leading-snug text-faint">{e.note}</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-faint">
        Run by government agencies, not by Gharmatch.{" "}
        <Link href="/help/directory" className="underline underline-offset-4">
          See sources and what we have checked
        </Link>
        .
      </p>
    </div>
  );
}
