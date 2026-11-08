"use client";

import { useActionState } from "react";
import { clearTrustedContactAction, saveTrustedContactAction, type FormState } from "@/app/actions";
import { FormMessage, KeptForm, SubmitButton, TextInput } from "./Fields";

const initial: FormState = {};

export function TrustedContactForm({ current }: { current: { name: string; phone: string } | null }) {
  const [state, action, pending] = useActionState(saveTrustedContactAction, initial);
  const e = state.fieldErrors ?? {};
  return (
    <div>
      <KeptForm action={action} pending={pending} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="name" label="Their name" defaultValue={current?.name} maxLength={60} required error={e.name} />
          <TextInput name="phone" label="Their mobile number" defaultValue={current?.phone} inputMode="numeric" autoComplete="off" required error={e.phone} />
        </div>
        <FormMessage error={state.error} ok={state.ok} />
        <SubmitButton>{current ? "Update trusted contact" : "Save trusted contact"}</SubmitButton>
      </KeptForm>
      {current ? (
        <form action={clearTrustedContactAction} className="mt-3">
          <button className="text-sm text-faint underline underline-offset-4 hover:text-text">Remove trusted contact</button>
        </form>
      ) : null}
    </div>
  );
}
