"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { sendInterestAction, type FormState } from "@/app/actions";
import { MatchRing } from "@/components/ui/MatchRing";
import { FormMessage, SubmitButton, TextArea } from "@/components/form/Fields";
import type { MatchResult } from "@/lib/matching";

interface Search {
  id: string;
  label: string;
  result: MatchResult;
}
type Payload = { signedIn: boolean; isOwner?: boolean; searches: Search[] };

const UNFIXABLE = new Set(["occupantGroup", "city", "tenantType"]);
const initial: FormState = {};

/** Shows the fit between this home and one of the visitor's own searches, before any message is sent. */
export function MatchPanel({ listingId, slug }: { listingId: string; slug: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [pick, setPick] = useState(0);
  const [state, action] = useActionState(sendInterestAction, initial);

  useEffect(() => {
    const ctl = new AbortController();
    fetch(`/api/match/${listingId}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : { signedIn: false, searches: [] }))
      .then(setData)
      .catch(() => undefined);
    return () => ctl.abort();
  }, [listingId]);

  if (!data) return <div className="h-48 rounded-2xl border border-line bg-surface" aria-hidden />;

  if (!data.signedIn) {
    return (
      <Box>
        <p className="font-display text-2xl font-semibold tracking-tight">See if it fits you.</p>
        <p className="mt-3 text-sm leading-relaxed text-soft">Sign in and post what you need. We show the match and any rule that clashes, before you write to anyone.</p>
        <Link href={`/signin?next=/listings/${slug}`} className="mt-6 inline-flex h-11 items-center rounded-full bg-text px-6 text-sm font-medium text-void">Sign in</Link>
      </Box>
    );
  }
  if (data.isOwner) return <Box><p className="text-sm text-soft">This is your home. Manage it from your dashboard.</p></Box>;
  if (data.searches.length === 0) {
    return (
      <Box>
        <p className="font-display text-2xl font-semibold tracking-tight">Post what you need first.</p>
        <p className="mt-3 text-sm text-soft">One short form, and every home shows your match.</p>
        <Link href="/searches/new" className="mt-6 inline-flex h-11 items-center rounded-full bg-text px-6 text-sm font-medium text-void">Post a search</Link>
      </Box>
    );
  }

  const s = data.searches[pick] ?? data.searches[0]!;
  const r = s.result;
  const blocked = r.hardConflicts.some((c) => UNFIXABLE.has(c.code));
  const conflicts = r.hardConflicts.length > 0;

  return (
    <Box>
      {data.searches.length > 1 ? (
        <select value={pick} onChange={(e) => setPick(Number(e.target.value))} aria-label="Which search" className="mb-5 h-10 w-full rounded-xl border border-line bg-void px-3 text-sm">
          {data.searches.map((x, i) => <option key={x.id} value={i}>{x.label}</option>)}
        </select>
      ) : <p className="index mb-5">{s.label}</p>}
      <div className="flex items-center gap-5">
        <MatchRing key={s.id} score={r.score} size={92} />
        <p className="font-display text-xl font-semibold leading-tight tracking-tight">{conflicts ? "A rule clashes with your search." : "Looks like a fit."}</p>
      </div>
      <ul className="mt-6 space-y-2 text-sm">
        {r.hardConflicts.map((c) => <li key={c.text} className="rounded-xl border border-danger/40 bg-danger/5 px-3 py-2">{c.text}</li>)}
        {r.cautions.map((c) => <li key={c.text} className="rounded-xl border border-line px-3 py-2 text-soft">{c.text}</li>)}
        {r.matches.slice(0, 4).map((c) => <li key={c.text} className="px-1 text-soft">· {c.text}</li>)}
      </ul>

      {blocked ? (
        <p className="mt-6 rounded-xl border border-line px-4 py-3 text-sm text-soft">This home’s basic rules do not fit this search, so interest cannot be sent.</p>
      ) : (
        <form action={action} className="mt-6 space-y-4">
          <input type="hidden" name="listingId" value={listingId} />
          <input type="hidden" name="requirementId" value={s.id} />
          <TextArea name="message" label="A short note to the landlord" hint="No phone numbers, emails or links. Contacts open after they accept." maxLength={400} required />
          {conflicts ? (
            <label className="flex items-start gap-3 text-sm text-soft">
              <input type="checkbox" name="acknowledgeConflicts" value="yes" required className="mt-1 size-4 accent-[var(--color-lamp)]" />
              I have read the clashes above and still want to ask.
            </label>
          ) : null}
          <FormMessage error={state.error} ok={state.ok} />
          <SubmitButton>Express interest</SubmitButton>
        </form>
      )}
    </Box>
  );
}

function Box({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-line bg-surface p-7">{children}</div>;
}
