import Link from "next/link";
import { REPO_URL } from "@/lib/legal";

export function Footer() {
  // No placeholder address: until a real one is set, the footer points to the Terms, where the officer is named.
  const grievance = process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL?.trim();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-xl font-semibold tracking-tight">gharmatch<span className="text-lamp">.</span></p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-faint">
            Homes for rent in Ahmedabad and Gandhinagar, matched on house rules. No broker fee.
          </p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-faint">
            Open source under the GNU AGPL v3.{" "}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-text">
              Source code
            </a>
          </p>
        </div>
        <ul className="space-y-0 text-sm text-soft">
          <li><Link href="/listings" className="inline-block py-2 hover:text-text">Browse homes</Link></li>
          <li><Link href="/safety" className="inline-block py-2 hover:text-text">Safety guide</Link></li>
          <li><Link href="/safety/women" className="inline-block py-2 hover:text-text">Safety for women</Link></li>
          <li><Link href="/help" className="inline-block py-2 text-danger hover:text-text">Need help now</Link></li>
          <li><Link href="/house-rules-policy" className="inline-block py-2 hover:text-text">House rules, not who you are</Link></li>
        </ul>
        <ul className="space-y-0 text-sm text-soft">
          <li><Link href="/privacy" className="inline-block py-2 hover:text-text">Privacy</Link></li>
          <li><Link href="/terms" className="inline-block py-2 hover:text-text">Terms</Link></li>
          <li>
            {grievance ? (
              <a href={`mailto:${grievance}`} className="inline-block py-2 hover:text-text">Grievance: {grievance}</a>
            ) : (
              <Link href="/terms#grievance" className="inline-block py-2 hover:text-text">Grievance officer</Link>
            )}
          </li>
        </ul>
      </div>
    </footer>
  );
}
