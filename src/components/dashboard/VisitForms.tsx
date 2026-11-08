"use client";

import { useActionState, useEffect, useState } from "react";
import { confirmVisitAction, fileAppealAction, proposeVisitAction, type FormState } from "@/app/actions";
import { FormMessage, Pills, Select, SubmitButton, TextArea, TextInput, yesNo } from "@/components/form/Fields";

const initial: FormState = {};

/** Tenant side: ask for a time. The owner then confirms and names who will meet you. */
export function VisitPlanner({ interestId }: { interestId: string }) {
  const [state, action] = useActionState(proposeVisitAction, initial);
  const e = state.fieldErrors ?? {};
  return (
    <details className="mt-4 border-t border-line pt-4">
      <summary className="cursor-pointer text-sm text-soft hover:text-text">Plan a visit</summary>
      <form action={action} className="mt-4 space-y-5">
        <input type="hidden" name="interestId" value={interestId} />
        <TextInput name="scheduledAt" label="Date and time" type="datetime-local" required error={e.scheduledAt} hint="Daytime is safer. You can bring a friend or family member." />
        <Pills name="companion" label="Someone is coming with me" options={yesNo} defaultValue={["no"]} />
        <TextArea name="note" label="Note (optional)" maxLength={200} error={e.note} />
        <FormMessage error={state.error} ok={state.ok} />
        <SubmitButton>Request this time</SubmitButton>
      </form>
    </details>
  );
}

/** Owner side: confirm and name the person who will meet the visitor. */
export function VisitConfirm({ visitId }: { visitId: string }) {
  const [state, action] = useActionState(confirmVisitAction, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="mt-4 space-y-4 rounded-xl border border-line p-4">
      <input type="hidden" name="visitId" value={visitId} />
      <p className="text-sm text-soft">Who will meet the visitor? They will see this name before they come.</p>
      <TextInput name="representativeName" label="Name" maxLength={60} required error={e.representativeName} />
      <Select
        name="representativeRole"
        label="Relationship to the home"
        options={[
          { value: "OWNER", label: "Owner" },
          { value: "FAMILY_MEMBER", label: "Owner's family member" },
          { value: "CARETAKER", label: "Caretaker" },
          { value: "AGENT", label: "Authorized agent" },
        ]}
      />
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton>Confirm visit</SubmitButton>
    </form>
  );
}

/** Owner or tenant whose listing or search was held after a report can ask for a second look. */
export function AppealForm({ reportId }: { reportId: string }) {
  const [state, action] = useActionState(fileAppealAction, initial);
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="reportId" value={reportId} />
      <TextArea name="message" label="Tell us what we should know" maxLength={800} required error={e.message} />
      <FormMessage error={state.error} ok={state.ok} />
      <SubmitButton>Appeal</SubmitButton>
    </form>
  );
}

/** Opens WhatsApp with a ready message, addressed to the saved trusted contact if there is one. You press send. */
export function TrustedShare({ text, label }: { text: string; label: string }) {
  const [contact, setContact] = useState<{ name: string; phone: string } | null>(null);
  useEffect(() => {
    const ctl = new AbortController();
    fetch("/api/me/safety", { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : { contact: null }))
      .then((j: { contact: { name: string; phone: string } | null }) => setContact(j.contact))
      .catch(() => undefined);
    return () => ctl.abort();
  }, []);
  const digits = contact?.phone.replace(/\D/g, "").slice(-10);
  const href = `https://wa.me/${digits ? `91${digits}` : ""}?text=${encodeURIComponent(text)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center rounded-full border border-line-strong px-4 text-sm text-text hover:bg-raised">
      {contact ? `${label} ${contact.name}` : `${label} someone I trust`}
    </a>
  );
}
