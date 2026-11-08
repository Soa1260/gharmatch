"use client";

import { useActionState } from "react";
import { saveProfileAction, type FormState } from "@/app/actions";
import { FormMessage, KeptForm, Pills, SubmitButton, TextInput } from "./Fields";

const initialState: FormState = {};

export function OnboardingForm({ next, initial }: { next: string; initial: { name: string; phone: string; roles: string[] } }) {
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
      <FormMessage error={state.error} />
      <SubmitButton>Continue</SubmitButton>
    </KeptForm>
  );
}
