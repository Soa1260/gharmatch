"use client";

import { m } from "motion/react";
import { useId } from "react";
import { spring } from "@/lib/motion";

export interface ChipOption {
  value: string;
  label: string;
}

/** Single-select pills. The highlight slides between options with a shared-layout spring. */
export function Chips({ options, value, onChange, label }: { options: ChipOption[]; value: string; onChange: (v: string) => void; label: string }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`relative h-10 rounded-full border px-4 text-sm transition-colors ${active ? "border-transparent text-void" : "border-line text-soft hover:border-line-strong hover:text-text"}`}
          >
            {active ? <m.span layoutId={`chip-${id}`} transition={spring.snappy} className="absolute inset-0 rounded-full bg-text" /> : null}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
