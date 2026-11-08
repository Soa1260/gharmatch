"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { FilterMenu } from "./FilterMenu";
import { Chips } from "@/components/ui/Chips";
import { AREAS, CITIES, CITY_LABEL, type City } from "@/lib/domain";

/** Filters live in the URL, so every search can be shared and the page stays server-rendered. */
export function BrowseFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const city = params.get("city") ?? "";
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "city") next.delete("area");
    next.delete("cursor");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  const areaOptions = city && (CITIES as readonly string[]).includes(city) ? AREAS[city as City] : [];

  return (
    <div className={`space-y-6 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <Chips
        label="City"
        value={city}
        onChange={(v) => set("city", v)}
        options={[{ value: "", label: "Both cities" }, ...CITIES.map((c) => ({ value: c, label: CITY_LABEL[c] }))]}
      />
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <Chips
          label="Bedrooms"
          value={params.get("bhk") ?? ""}
          onChange={(v) => set("bhk", v)}
          options={[{ value: "", label: "Any BHK" }, { value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3", label: "3+" }]}
        />
        <Chips
          label="Maximum rent"
          value={params.get("max") ?? ""}
          onChange={(v) => set("max", v)}
          options={[{ value: "", label: "Any rent" }, { value: "15000", label: "₹15k" }, { value: "25000", label: "₹25k" }, { value: "40000", label: "₹40k" }]}
        />
        <FilterMenu />
      </div>
      {areaOptions.length > 0 ? (
        <label className="flex items-center gap-3 text-sm text-soft">
          Area
          <select
            value={params.get("area") ?? ""}
            onChange={(e) => set("area", e.target.value)}
            className="h-10 rounded-full border border-line bg-surface px-4 text-sm text-text"
          >
            <option value="">All areas</option>
            {areaOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
