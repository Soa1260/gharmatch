"use client";

import { useActionState } from "react";
import { inviteTenantAction, type FormState } from "@/app/actions";
import { FormMessage, Select, SubmitButton, TextArea } from "./Fields";

const initial: FormState = {};

export function InviteForm({ requirementId, listings }: { requirementId: string; listings: Array<{ id: string; title: string }> }) {
  const [state, action] = useActionState(inviteTenantAction, initial);
  return (
    <details className="mt-5 border-t border-line pt-4">
      <summary className="cursor-pointer text-sm text-soft hover:text-text">Invite to one of my homes</summary>
      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="requirementId" value={requirementId} />
        <Select name="listingId" label="Which home" options={listings.map((l) => ({ value: l.id, label: l.title }))} />
        <TextArea name="message" label="Your note" hint="No phone numbers, emails or links. They see your home, not your contact, until they accept." maxLength={400} required error={state.fieldErrors?.message} />
        <FormMessage error={state.error} ok={state.ok} />
        <SubmitButton>Send invitation</SubmitButton>
      </form>
    </details>
  );
}
