"use client";

import { AnimatePresence, m } from "motion/react";
import { useMemo, useState } from "react";
import { Chips } from "@/components/ui/Chips";
import { MatchRing } from "@/components/ui/MatchRing";
import { matchListing, type ListingFacts, type RequirementFacts } from "@/lib/matching";
import { duration, ease, spring } from "@/lib/motion";

const listing: ListingFacts = {
  city: "AHMEDABAD",
  area: "Bopal",
  rent: 20000,
  availableFrom: new Date("2026-12-01"),
  dietPolicy: "VEG_ONLY",
  tenantTypes: ["FAMILY", "BACHELORS", "WORKING_WOMEN"],
  pets: "CASE_BY_CASE",
  smoking: "NOT_ALLOWED",
  alcohol: "NOT_ALLOWED",
  minLeaseMonths: 11,
  maxOccupants: 3,
  genderPolicy: "ANY",
  securityFeatures: ["BUILDING_ACCESS_CONTROL", "CCTV"],
};

const base: RequirementFacts = {
  city: "AHMEDABAD",
  areas: ["Bopal"],
  budgetMax: 22000,
  moveInDate: new Date("2026-12-01"),
  tenantType: "BACHELORS",
  diet: "VEG",
  hasPets: false,
  smokes: false,
  drinks: false,
  durationMonths: 12,
  occupants: 2,
  occupantGroup: "MEN",
  needsSecurity: true,
};

const rules = ["Vegetarian food only", "No smoking or alcohol", "Pets: ask first", "Gated society, CCTV", "11 month minimum lease"];

/** Runs the real matching function so visitors can see how a conflict is explained before they send interest. */
export function MatchDemo() {
  const [diet, setDiet] = useState<"VEG" | "EGG" | "NON_VEG">("VEG");
  const [smoke, setSmoke] = useState("no");
  const result = useMemo(
    () => matchListing({ ...base, diet, smokes: smoke === "yes" }, listing),
    [diet, smoke],
  );
  const rows = [
    ...result.hardConflicts.map((r) => ({ ...r, kind: "conflict" as const })),
    ...result.cautions.map((r) => ({ ...r, kind: "caution" as const })),
    ...result.matches.map((r) => ({ ...r, kind: "match" as const })),
  ].slice(0, 6);

  return (
    <div className="grid gap-px overflow-hidden rounded-[28px] border border-line bg-line md:grid-cols-[1fr_1.1fr]">
      <div className="bg-surface p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.16em] text-faint">The landlord wrote</p>
        <p className="mt-3 text-xl font-light tracking-tight">2 BHK in Bopal · ₹20,000</p>
        <ul className="mt-6 space-y-3 text-[15px] text-soft">
          {rules.map((r) => (
            <li key={r} className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-lamp" />
              {r}
            </li>
          ))}
        </ul>
        <div className="mt-10 space-y-5">
          <p className="text-xs uppercase tracking-[0.16em] text-faint">You say</p>
          <Chips
            label="Your food"
            value={diet}
            onChange={(v) => setDiet(v as typeof diet)}
            options={[
              { value: "VEG", label: "Vegetarian" },
              { value: "EGG", label: "Eat eggs" },
              { value: "NON_VEG", label: "Non-veg" },
            ]}
          />
          <Chips
            label="Smoking"
            value={smoke}
            onChange={setSmoke}
            options={[
              { value: "no", label: "I don't smoke" },
              { value: "yes", label: "I smoke" },
            ]}
          />
        </div>
      </div>

      <div className="bg-raised p-8 md:p-10" aria-live="polite">
        <div className="flex items-center gap-6">
          <MatchRing key={result.score} score={result.score} size={104} />
          <div>
            <p className="text-xl font-light tracking-tight">
              {result.hardConflicts.length > 0 ? "A rule conflicts with yours" : "Looks like a fit"}
            </p>
            <p className="mt-1 text-sm text-faint">
              {result.hardConflicts.length > 0 ? "You see this before sending interest." : "Send interest and the landlord decides."}
            </p>
          </div>
        </div>
        <ul className="mt-8 space-y-2.5">
          <AnimatePresence initial={false} mode="popLayout">
            {rows.map((r) => (
              <m.li
                key={r.code + r.kind + r.text}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } }}
                exit={{ opacity: 0, transition: { duration: duration.quick } }}
                transition={spring.smooth}
                className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  r.kind === "conflict" ? "border-danger/40 bg-danger/5 text-text" : "border-line text-soft"
                }`}
              >
                <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${r.kind === "conflict" ? "bg-danger" : r.kind === "caution" ? "bg-lamp" : "bg-ok"}`} />
                {r.text}
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  );
}
