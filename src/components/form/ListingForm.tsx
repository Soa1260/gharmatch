"use client";

import { useActionState, useState } from "react";
import { createListingAction, updateListingAction, type FormState } from "@/app/actions";
import { AREAS, CITIES, CITY_LABEL, type City } from "@/lib/domain";
import { label } from "@/lib/labels";
import { Field, FormMessage, KeptForm, Pills, Select, SubmitButton, TextArea, TextInput, yesNo } from "./Fields";

const initialState: FormState = {};
const opts = (d: Record<string, string>) => Object.entries(d).map(([value, l]) => ({ value, label: l }));
const today = () => new Date().toISOString().slice(0, 10);

export interface ListingValues {
  id: string;
  title: string;
  city: City;
  area: string;
  rent: number;
  deposit: number;
  bhk: number;
  furnishing: string;
  availableFrom: string;
  description: string;
  dietPolicy: string;
  tenantTypes: string[];
  genderPolicy: string;
  securityFeatures: string[];
  pets: string;
  smoking: string;
  alcohol: string;
  visitors: string;
  quietHours: string | null;
  minLeaseMonths: number;
  noticeDays: number;
  parking: string;
  wfhAllowed: boolean;
  maxOccupants: number;
  mapsLink: string;
  addressLine: string;
  cctvLocations: string | null;
  cctvAccess: string | null;
  occupancyNote: string | null;
  ownerLivesOnSite: boolean;
  keyHolders: string;
  ownerAccess: string;
  noticeHours: number;
  postedBy: string;
  /** True once the poster has confirmed they may let the home. Not asked again on every edit. */
  authorisationDeclared: boolean;
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-6 border-t border-line pt-10 md:grid-cols-[12rem_1fr]">
      <legend className="sr-only">{title}</legend>
      <p className="index" aria-hidden>({n}) {title}</p>
      <div className="space-y-7">{children}</div>
    </fieldset>
  );
}

/** Used for both posting a new home and editing one. Pass `initial` to edit. */
export function ListingForm({ initial }: { initial?: ListingValues }) {
  const editing = Boolean(initial);
  const [state, action, pending] = useActionState(editing ? updateListingAction : createListingAction, initialState);
  const [city, setCity] = useState<City>(initial?.city ?? "AHMEDABAD");
  const e = state.fieldErrors ?? {};

  return (
    <KeptForm action={action} pending={pending} className="mt-12 space-y-12">
      {initial ? <input type="hidden" name="listingId" value={initial.id} /> : null}
      <Section n="01" title="The home">
        <TextInput name="title" label="Title" hint="For example: 2 BHK near Bopal Cross Road" maxLength={90} required defaultValue={initial?.title} error={e.title} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Select name="city" label="City" defaultValue={initial?.city} onChange={(v) => setCity(v as City)} options={CITIES.map((c) => ({ value: c, label: CITY_LABEL[c] }))} />
          <Select key={city} name="area" label="Area" defaultValue={city === initial?.city ? initial?.area : undefined} error={e.area} options={AREAS[city].map((a) => ({ value: a, label: a }))} />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextInput name="rent" label="Rent per month (₹)" type="number" inputMode="numeric" min={1000} required defaultValue={initial?.rent} error={e.rent} />
          <TextInput name="deposit" label="Deposit (₹)" type="number" inputMode="numeric" min={0} required defaultValue={initial?.deposit} error={e.deposit} />
          <TextInput name="bhk" label="Bedrooms" type="number" min={1} max={6} defaultValue={initial?.bhk ?? 2} required error={e.bhk} />
        </div>
        <Pills name="furnishing" label="Furnishing" options={opts(label.furnishing)} defaultValue={[initial?.furnishing ?? "SEMI_FURNISHED"]} />
        <TextInput name="availableFrom" label="Available from" type="date" min={editing ? undefined : today()} required defaultValue={initial?.availableFrom} error={e.availableFrom} />
        <TextArea name="description" label="Describe the home and the lane" hint="Floor, lift, light, noise, what is nearby. Do not add phone numbers, and nothing about who the tenant is." maxLength={1500} required defaultValue={initial?.description} error={e.description} />
      </Section>

      <Section n="02" title="Location">
        <TextInput
          name="mapsLink"
          label="Google Maps link"
          hint="Open the home in Google Maps, tap Share, copy the link and paste it here. Coordinates like 23.0302, 72.4711 also work. We check the pin is inside your city and near your area."
          required
          defaultValue={initial?.mapsLink}
          error={e.mapsLink}
        />
        <TextInput
          name="addressLine"
          label="Full address (private)"
          hint="Flat, building and street. Shown only to a tenant after you accept their interest. Never shown publicly."
          maxLength={200}
          required
          defaultValue={initial?.addressLine}
          error={e.addressLine}
        />
      </Section>

      <Section n="03" title="House rules">
        <Pills name="dietPolicy" label="Food in the kitchen" options={opts(label.diet)} defaultValue={[initial?.dietPolicy ?? "NO_RESTRICTION"]} error={e.dietPolicy} />
        <Pills name="tenantTypes" label="Who can rent" multiple options={opts(label.tenantType)} defaultValue={initial?.tenantTypes ?? ["FAMILY", "BACHELORS"]} error={e.tenantTypes} />
        <Pills name="genderPolicy" label="Open to" options={opts(label.gender)} defaultValue={[initial?.genderPolicy ?? "ANY"]} />
        <Pills name="pets" label="Pets" options={opts(label.pets)} defaultValue={[initial?.pets ?? "CASE_BY_CASE"]} />
        <Pills name="smoking" label="Smoking" options={opts(label.habit)} defaultValue={[initial?.smoking ?? "OUTDOORS_ONLY"]} />
        <Pills name="alcohol" label="Alcohol" options={opts(label.habit)} defaultValue={[initial?.alcohol ?? "NOT_ALLOWED"]} />
        <Pills name="visitors" label="Visitors" options={opts(label.visitors)} defaultValue={[initial?.visitors ?? "FREE"]} />
        <TextInput name="quietHours" label="Quiet hours (optional)" hint="For example: after 10 pm" maxLength={60} defaultValue={initial?.quietHours ?? undefined} error={e.quietHours} />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextInput name="minLeaseMonths" label="Minimum lease (months)" type="number" min={1} defaultValue={initial?.minLeaseMonths ?? 11} required error={e.minLeaseMonths} />
          <TextInput name="noticeDays" label="Notice (days)" type="number" min={0} defaultValue={initial?.noticeDays ?? 30} required error={e.noticeDays} />
          <TextInput name="maxOccupants" label="Most people" type="number" min={1} defaultValue={initial?.maxOccupants ?? 3} required error={e.maxOccupants} />
        </div>
        <Pills name="parking" label="Parking" options={opts(label.parking)} defaultValue={[initial?.parking ?? "TWO_WHEELER"]} />
        <Pills name="wfhAllowed" label="Work from home" options={yesNo.slice().reverse()} defaultValue={[initial ? (initial.wfhAllowed ? "yes" : "no") : "yes"]} />
      </Section>

      <Section n="04" title="Living here">
        <Pills name="ownerLivesOnSite" label="Does the owner or family live in the same building?" options={yesNo} defaultValue={[initial?.ownerLivesOnSite ? "yes" : "no"]} />
        <TextInput name="occupancyNote" label="Who else lives in the flat or building (optional)" hint="For example: two other tenants in the flat, both women. Describe, never name." maxLength={200} defaultValue={initial?.occupancyNote ?? undefined} error={e.occupancyNote} />
        <Pills name="keyHolders" label="Who keeps duplicate keys" options={opts(label.keyHolders)} defaultValue={[initial?.keyHolders ?? "TENANT_ONLY"]} />
        <Pills name="ownerAccess" label="When may the owner enter" options={opts(label.ownerAccess)} defaultValue={[initial?.ownerAccess ?? "WITH_NOTICE"]} />
        <TextInput name="noticeHours" label="Notice before the owner or maintenance enters (hours)" type="number" min={0} max={168} defaultValue={initial?.noticeHours ?? 24} required error={e.noticeHours} />
      </Section>

      <Section n="05" title="Safety assessment">
        <Field label="What does the building have?" hint="Tick only what is true today. Tenants see these as “Declared by landlord”. A tick does not make a home safe, and only an inspection by our team can show “Verified”.">
          <Pills name="securityFeatures" label="Safety items" multiple options={opts(label.security)} defaultValue={initial?.securityFeatures ?? []} error={e.securityFeatures} />
        </Field>
        <TextInput name="cctvLocations" label="If you ticked CCTV: where are the cameras" hint="Common areas only, for example: main gate, parking, lift lobby." maxLength={200} defaultValue={initial?.cctvLocations ?? undefined} error={e.cctvLocations} />
        <TextInput name="cctvAccess" label="If you ticked CCTV: who can see the recordings" hint="For example: society committee only, kept for 30 days." maxLength={200} defaultValue={initial?.cctvAccess ?? undefined} error={e.cctvAccess} />
        <Pills name="noPrivateCameras" label="There are no cameras in any bedroom, bathroom or other private space" options={yesNo} defaultValue={["no"]} error={e.noPrivateCameras} />
      </Section>

      <Section n="06" title="Who is posting">
        <Pills name="postedBy" label="You are posting this home as" options={opts(label.postedBy)} defaultValue={[initial?.postedBy ?? "OWNER"]} error={e.postedBy} />
        <Pills
          name="declareAuthorised"
          label="I own this home or the owner has authorised me to let it, and I will not take any fee, commission or token money from tenants"
          options={yesNo}
          defaultValue={[initial?.authorisationDeclared ? "yes" : "no"]}
          error={e.declareAuthorised}
        />
        <p className="max-w-lg text-sm text-faint">Gharmatch is not for brokers. Tenants can report a listing that asks for a fee, and listings that do are removed.</p>
      </Section>

      <div className="space-y-4 border-t border-line pt-10">
        <p className="max-w-lg text-sm text-faint">Your listing stays live for 30 days, then asks if it is still available. Your phone and email are never shown on the public page.</p>
        <FormMessage error={state.error} />
        <SubmitButton>{editing ? "Save changes" : "Publish listing"}</SubmitButton>
      </div>
    </KeptForm>
  );
}
