"use client";

import { useActionState, useState } from "react";
import { createRequirementAction, updateRequirementAction, type FormState } from "@/app/actions";
import { AREAS, CITIES, CITY_LABEL, type City } from "@/lib/domain";
import { label } from "@/lib/labels";
import { FormMessage, KeptForm, Pills, Select, SubmitButton, TextArea, TextInput, yesNo } from "./Fields";

const initialState: FormState = {};
const opts = (d: Record<string, string>) => Object.entries(d).map(([value, l]) => ({ value, label: l }));
const today = () => new Date().toISOString().slice(0, 10);
const yn = (v: boolean | undefined, fallback: "yes" | "no") => [v === undefined ? fallback : v ? "yes" : "no"];

export interface SearchValues {
  id: string;
  occupantGroup: string;
  tenantType: string;
  city: City;
  occupants: number;
  areas: string[];
  budgetMin: number;
  budgetMax: number;
  moveInDate: string;
  durationMonths: number;
  diet: string;
  hasPets: boolean;
  smokes: boolean;
  drinks: boolean;
  needsSecurity: boolean;
  acceptsInvites: boolean;
  intro: string;
}

/** Used for both posting a new search and editing one. Pass `initial` to edit. */
export function SearchForm({ initial }: { initial?: SearchValues }) {
  const editing = Boolean(initial);
  const [state, action, pending] = useActionState(editing ? updateRequirementAction : createRequirementAction, initialState);
  const [city, setCity] = useState<City>(initial?.city ?? "AHMEDABAD");
  const e = state.fieldErrors ?? {};

  return (
    <KeptForm action={action} pending={pending} className="mt-12 space-y-8">
      {initial ? <input type="hidden" name="requirementId" value={initial.id} /> : null}
      <Pills
        name="occupantGroup"
        label="Who will live there"
        options={[{ value: "MEN", label: "Men" }, { value: "WOMEN", label: "Women" }, { value: "MIXED", label: "Mixed group or family" }]}
        defaultValue={[initial?.occupantGroup ?? "MEN"]}
      />
      <Pills name="tenantType" label="Household type" options={opts(label.tenantType)} defaultValue={[initial?.tenantType ?? "BACHELORS"]} error={e.tenantType} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select name="city" label="City" defaultValue={initial?.city} onChange={(v) => setCity(v as City)} options={CITIES.map((c) => ({ value: c, label: CITY_LABEL[c] }))} />
        <TextInput name="occupants" label="How many people" type="number" min={1} max={12} defaultValue={initial?.occupants ?? 1} required error={e.occupants} />
      </div>
      <Pills key={city} name="areas" label="Areas (up to 5)" multiple options={AREAS[city].map((a) => ({ value: a, label: a }))} defaultValue={city === initial?.city ? initial?.areas : []} error={e.areas} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput name="budgetMin" label="Budget from (₹)" type="number" min={0} defaultValue={initial?.budgetMin ?? 10000} required error={e.budgetMin} />
        <TextInput name="budgetMax" label="Budget up to (₹)" type="number" min={1000} defaultValue={initial?.budgetMax} required error={e.budgetMax} />
        <TextInput name="moveInDate" label="Move in by" type="date" min={editing ? undefined : today()} defaultValue={initial?.moveInDate} required error={e.moveInDate} />
        <TextInput name="durationMonths" label="Staying for (months)" type="number" min={1} defaultValue={initial?.durationMonths ?? 12} required error={e.durationMonths} />
      </div>
      <Pills name="diet" label="Your food" options={[{ value: "VEG", label: "Vegetarian" }, { value: "EGG", label: "Eat eggs" }, { value: "NON_VEG", label: "Non-veg" }]} defaultValue={[initial?.diet ?? "VEG"]} />
      <div className="grid gap-7 sm:grid-cols-3">
        <Pills name="hasPets" label="Pets" options={yesNo} defaultValue={yn(initial?.hasPets, "no")} />
        <Pills name="smokes" label="Smoke" options={yesNo} defaultValue={yn(initial?.smokes, "no")} />
        <Pills name="drinks" label="Drink" options={yesNo} defaultValue={yn(initial?.drinks, "no")} />
      </div>
      <Pills name="needsSecurity" label="Need security features (guard, CCTV, gated)" options={yesNo} defaultValue={yn(initial?.needsSecurity, "no")} />
      <Pills name="acceptsInvites" label="Let landlords invite me" options={yesNo.slice().reverse()} defaultValue={yn(initial?.acceptsInvites, "yes")} />
      <TextArea name="intro" label="A short intro" hint="What you do, hours, anything practical. Landlords of women and mixed groups do not see this until you reply." maxLength={400} required defaultValue={initial?.intro} error={e.intro} />
      <FormMessage error={state.error} />
      <SubmitButton>{editing ? "Save changes" : "Post my search"}</SubmitButton>
    </KeptForm>
  );
}
