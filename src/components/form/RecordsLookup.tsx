"use client";

import { useActionState, useState } from "react";
import { lookupRecordsAction, type RecordsState } from "@/app/actions";
import { FormMessage, SubmitButton, TextArea, TextInput } from "@/components/form/Fields";
import type { AccountRecord } from "@/server/records";

const initial: RecordsState = {};
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "none");

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-4 py-2.5 text-[15px]">
      <dt className="text-faint">{k}</dt>
      <dd className="break-all">{v}</dd>
    </div>
  );
}

function Result({ r, sheet }: { r: AccountRecord; sheet: string }) {
  const [copied, setCopied] = useState(false);
  const u = r.user;
  const deleted = u.status === "DELETED";
  async function copy() {
    try {
      await navigator.clipboard.writeText(sheet);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="mt-10 space-y-8">
      <section>
        <h2 className="index">Account</h2>
        <dl className="mt-3 divide-y divide-line border-y border-line">
          <Row k="Account id" v={u.id} />
          <Row k="Status" v={`${u.status.toLowerCase()}${deleted ? `, deleted ${when(u.deletedAt)}` : ""}`} />
          <Row k="Name" v={deleted ? "Removed on deletion" : (u.name ?? "Not given")} />
          <Row k="Email" v={deleted ? "Removed on deletion" : u.email} />
          <Row k="Phone" v={deleted ? "Removed on deletion" : (u.phone ?? "Not given")} />
          <Row k="Created" v={when(u.createdAt)} />
          <Row k="ID checked" v={u.identityCheckedAt ? `${when(u.identityCheckedAt)}, ${(u.identityMethod ?? "").toLowerCase().replace(/_/g, " ")}` : "No"} />
          <Row k="Terms accepted" v={`${when(u.termsAcceptedAt)}${u.termsVersion ? `, version ${u.termsVersion}` : ""}`} />
          {u.fingerprintKept ? <Row k="Email fingerprint" v="Kept (one-way, cannot be turned back into the address)" /> : null}
        </dl>
      </section>

      {r.rejoinNotes.length > 0 ? (
        <section className="rounded-2xl border border-lamp/60 p-5 text-sm">
          <h2 className="index">Returned after deleting</h2>
          <ul className="mt-2 space-y-1">{r.rejoinNotes.map((n) => <li key={n.at + n.note}>{when(n.at)}: {n.note}</li>)}</ul>
        </section>
      ) : null}

      <section>
        <h2 className="index">Reports about this account ({r.reportsAbout.length})</h2>
        <ul className="mt-3 space-y-1 font-mono text-xs text-soft">
          {r.reportsAbout.length === 0 ? <li className="font-sans text-sm text-faint">None.</li> : null}
          {r.reportsAbout.map((p) => <li key={p.id}>{p.id} · {p.category.toLowerCase().replace(/_/g, " ")} · {p.severity.toLowerCase()} · {p.status.toLowerCase().replace(/_/g, " ")} · {when(p.createdAt)}</li>)}
        </ul>
        <p className="mt-3 text-sm text-faint">{r.listings.length} homes · {r.searches.length} searches · {r.interests} conversations · has filed {r.reportsFiled} reports.</p>
      </section>

      <section>
        <h2 className="index">Earlier lookups of this account ({r.earlierLookups.length})</h2>
        <ul className="mt-3 space-y-1 text-sm text-soft">
          {r.earlierLookups.map((l) => <li key={l.at + l.by}>{when(l.at)} · by {l.by} · {l.reason}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="index">Records sheet</h2>
        <p className="mt-2 max-w-xl text-sm text-soft">Plain text for a reply to a police, court or regulator request, or for the case file. Read it before you send it. It is a summary of our records, not the notice itself.</p>
        <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded-2xl border border-line bg-surface p-5 font-mono text-xs">{sheet}</pre>
        <button type="button" onClick={copy} className="mt-3 h-10 rounded-full border border-line-strong px-5 text-sm hover:bg-raised">{copied ? "Copied" : "Copy the sheet"}</button>
      </section>
    </div>
  );
}

export function RecordsLookup() {
  const [state, action] = useActionState(lookupRecordsAction, initial);
  return (
    <>
      <form action={action} className="mt-8 space-y-5">
        <TextInput name="query" label="Account id, email address or report id" required maxLength={200} autoComplete="off" />
        <TextArea name="reason" label="Reason or reference" hint="For example: police notice number and date, court order, or the report id and why. This is saved with your name and the time." required minLength={10} maxLength={300} />
        <FormMessage error={state.error} />
        <SubmitButton>Look up</SubmitButton>
      </form>
      {state.record && state.sheet ? <Result r={state.record} sheet={state.sheet} /> : null}
    </>
  );
}
