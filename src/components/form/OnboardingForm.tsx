"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProfileAction, type FormState } from "@/app/actions";
import { FormMessage, KeptForm, Pills, SubmitButton, TextInput } from "./Fields";

const initialState: FormState = {};

export function OnboardingForm({
  next,
  initial,
  needsAgreement,
}: {
  next: string;
  initial: { name: string; phone: string; roles: string[] };
  needsAgreement: boolean;
}) {
  const [state, action, pending] = useActionState(saveProfileAction, initialState);
  const e = state.fieldErrors ?? {};
  return (
    <KeptForm action={action} pending={pending} className="mt-12 space-y-7">
      <input type="hidden" name="next" value={next} />
      <TextInput name="name" label="Your name" autoComplete="name" required defaultValue={initial.name} error={e.name} />
      <TextInput
        name="phone"
        label="Mobile number (required to rent out a home)"
        hint="10 digits. Hidden until someone you accept, or who accepts you. Tenants can leave it empty."
        inputMode="numeric"
        autoComplete="tel"
        defaultValue={initial.phone}
        error={e.phone}
      />
      <Pills name="roles" label="I want to" multiple defaultValue={initial.roles} options={[{ value: "tenant", label: "Find a home" }, { value: "landlord", label: "Rent out a home" }]} error={e.isTenant} />
      {needsAgreement ? (
        <label className="flex items-start gap-3 rounded-xl border border-line p-4 text-sm leading-relaxed text-soft">
          <input type="checkbox" name="acceptTerms" value="yes" required className="mt-1 size-4 shrink-0 accent-[var(--color-lamp)]" />
          <span>
            I confirm I am 18 or older and agree to the{" "}
            <Link href="/terms" target="_blank" className="underline underline-offset-4">Terms of Use</Link> (including the mediative dispute framework) and the{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-4">Privacy Policy</Link>.
          </span>
        </label>
      ) : null}
      <FormMessage error={state.error} />
      <SubmitButton>Continue</SubmitButton>
    </KeptForm>
  );
}
