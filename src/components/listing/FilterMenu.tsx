"use client";

import { AnimatePresence, m } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { FILTER_GROUPS } from "@/lib/filters";
import { duration, ease } from "@/lib/motion";

type Picked = Record<string, string[]>;

const readFrom = (params: URLSearchParams): Picked =>
  Object.fromEntries(FILTER_GROUPS.map((g) => [g.param, (params.get(g.param) ?? "").split(",").filter(Boolean)]));

/**
 * One button that opens a panel where several options per group can be ticked, then applied together.
 * Nothing is sent to the server until Apply, so each tick does not trigger a page load.
 */
export function FilterMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const panelId = useId();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Picked>(() => readFrom(new URLSearchParams(params.toString())));

  const applied = FILTER_GROUPS.reduce((n, g) => n + (params.get(g.param)?.split(",").filter(Boolean).length ?? 0), 0);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (param: string, value: string) =>
    setPicked((p) => {
      const cur = p[param] ?? [];
      return { ...p, [param]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });

  const draftCount = Object.values(picked).reduce((n, v) => n + v.length, 0);

  function apply(next: Picked) {
    const q = new URLSearchParams(params.toString());
    for (const g of FILTER_GROUPS) {
      const v = next[g.param] ?? [];
      if (v.length) q.set(g.param, v.join(","));
      else q.delete(g.param);
    }
    q.delete("cursor");
    setOpen(false);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) setPicked(readFrom(new URLSearchParams(params.toString())));
          setOpen((o) => !o);
        }}
        className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm transition-colors ${applied ? "border-lamp text-lamp" : "border-line text-soft hover:border-line-strong hover:text-text"}`}
      >
        More filters
        {applied ? <span className="grid size-5 place-items-center rounded-full bg-lamp font-mono text-[11px] text-void">{applied}</span> : null}
        <span aria-hidden className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      <AnimatePresence>
        {open ? <div aria-hidden onClick={() => setOpen(false)} className="fixed inset-0 z-40 bg-void/70 sm:hidden" /> : null}
        {open ? (
          <m.div
            id={panelId}
            role="dialog"
            aria-label="More filters"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: duration.base, ease: ease.out } }}
            exit={{ opacity: 0, y: -6, transition: { duration: duration.quick } }}
            className="fixed inset-x-3 bottom-3 z-50 flex max-h-[82svh] flex-col rounded-2xl border border-line-strong bg-surface p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-12 sm:z-30 sm:max-h-none sm:w-[34rem] sm:origin-top-left"
          >
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto pr-1 sm:max-h-[60vh] sm:flex-none">
              {FILTER_GROUPS.map((g) => (
                <fieldset key={g.param}>
                  <legend className="index mb-3">{g.title}</legend>
                  <div className="flex flex-wrap gap-2">
                    {g.values.map((v) => {
                      const on = (picked[g.param] ?? []).includes(v);
                      return (
                        <label
                          key={v}
                          className={`cursor-pointer select-none rounded-full border px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-lamp ${on ? "border-transparent bg-text text-void" : "border-line text-soft hover:border-line-strong hover:text-text"}`}
                        >
                          <input type="checkbox" checked={on} onChange={() => toggle(g.param, v)} className="sr-only" />
                          {(g.labels as Record<string, string>)[v] ?? v}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-4 flex shrink-0 items-center justify-between border-t border-line pt-4">
              <button type="button" onClick={() => setPicked(readFrom(new URLSearchParams()))} className="text-sm text-soft underline-offset-4 hover:text-text hover:underline">
                Clear all
              </button>
              <button type="button" onClick={() => apply(picked)} className="h-10 rounded-full bg-text px-6 text-sm font-medium text-void transition-colors hover:bg-white">
                Show homes{draftCount ? ` (${draftCount} filters)` : ""}
              </button>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
