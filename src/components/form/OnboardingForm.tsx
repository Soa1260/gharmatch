"use client";

import { useActionState } from "react";
import { saveProfileAction, type FormState } from "@/app/actions";
import { FormMessage, KeptForm, Pills, SubmitButton, TextInput } from "./Fields";

const initial: FormState = {};

export function OnboardingForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(saveProfileAction, initial);
  const e = state.fieldErrors ?? {};
  return (
    <KeptForm action={action} pending={pending} className="mt-12 space-y-7">
      <input type="hidden" name="next" value={next} />
      <TextInput name="name" label="Your name" autoComplete="name" required error={e.name} />
      <TextInput name="phone" label="Mobile number (optional)" hint="10 digits. Hidden until someone you accept, or who accepts you." inputMode="numeric" autoComplete="tel" error={e.phone} />
      <Pills name="roles" label="I want to" multiple defaultValue={["tenant"]} options={[{ value: "tenant", label: "Find a home" }, { value: "landlord", label: "Rent out a home" }]} />
      <FormMessage error={state.error} />
      <SubmitButton>Continue</SubmitButton>
    </KeptForm>
  );
}
