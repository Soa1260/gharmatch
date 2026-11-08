"use client";

import { useActionState, useState } from "react";
import { reportAction, type FormState } from "@/app/actions";
import { FormMessage, Select, SubmitButton, TextArea, TextInput } from "@/components/form/Fields";
import { EmergencyStrip } from "@/components/site/EmergencyStrip";
import { REPORT_CATEGORIES, REPORT_SEVERITY } from "@/lib/domain";
import { label } from "@/lib/labels";

const initial: FormState = {};
const categories = REPORT_CATEGORIES.map((value) => ({ value, label: label.reportCategory[value] }));

export function ReportButton({ targetType, targetId }: { targetType: "LISTING" | "REQUIREMENT" | "USER"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(reportAction, initial);
  const [category, setCategory] = useState("LANDLORD_HARASSMENT");
  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="inline-block py-3 text-sm text-faint underline-offset-4 transition-colors hover:text-text hover:underline">Report this {targetType === "REQUIREMENT" ? "search" : targetType.toLowerCase()}</button>;
  }
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-line bg-surface p-6">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <Select name="category" label="What is wrong?" options={categories} defaultValue="LANDLORD_HARASSMENT" onChange={setCategory} />
      {REPORT_SEVERITY[category as keyof typeof REPORT_SEVERITY] !== "MEDIUM" ? (
        <div className="space-y-2">
          <p className="text-sm text-danger">If you are in danger right now, call first. Then send this report.</p>
          <EmergencyStrip compact />
        </div>
      ) : null}
      <TextInput name="incidentAt" label="When did it happen (optional)" type="datetime-local" />
      <TextArea name="details" label="What happened (optional)" hint="We save a copy of this listing and your messages with it, so editing or deleting it cannot erase the record." maxLength={800} />
      <FormMessage error={state.error} ok={state.ok} />
      <div className="flex gap-3">
        <SubmitButton>Send report</SubmitButton>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-soft">Cancel</button>
      </div>
    </form>
  );
}
