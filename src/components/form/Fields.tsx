"use client";

import { m } from "motion/react";
import { createContext, startTransition, useContext, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { spring } from "@/lib/motion";

const input =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] text-text placeholder:text-faint transition-colors hover:border-line-strong focus:border-lamp focus:outline-none";

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-soft">{label}</p>
      {children}
      {hint && !error ? <p className="text-xs text-faint">{hint}</p> : null}
      {error ? <p role="alert" className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}

export function TextInput({ name, label, hint, error, type = "text", ...rest }: { name: string; label: string; hint?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error}>
      <input id={id} name={name} type={type} aria-label={label} aria-invalid={Boolean(error)} className={input} {...rest} />
    </Field>
  );
}

export function TextArea({ name, label, hint, error, ...rest }: { name: string; label: string; hint?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error}>
      <textarea name={name} aria-label={label} aria-invalid={Boolean(error)} rows={4} className={`${input} h-auto resize-y py-3`} {...rest} />
    </Field>
  );
}

export function Select({ name, label, options, error, defaultValue, onChange }: { name: string; label: string; options: Array<{ value: string; label: string }>; error?: string; defaultValue?: string; onChange?: (v: string) => void }) {
  return (
    <Field label={label} error={error}>
      <select name={name} aria-label={label} defaultValue={defaultValue} onChange={(e) => onChange?.(e.target.value)} className={input}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

/** Pill choices that submit as form values. `multiple` allows several; otherwise exactly one. */
export function Pills({ name, label, options, multiple = false, defaultValue, error }: { name: string; label: string; options: Array<{ value: string; label: string }>; multiple?: boolean; defaultValue?: string[]; error?: string }) {
  const id = useId();
  const [picked, setPicked] = useState<string[]>(defaultValue ?? (multiple ? [] : options[0] ? [options[0].value] : []));
  const toggle = (v: string) => setPicked((p) => (multiple ? (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]) : [v]));

  return (
    <Field label={label} error={error}>
      <div role={multiple ? "group" : "radiogroup"} aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = picked.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role={multiple ? "checkbox" : "radio"}
              aria-checked={on}
              onClick={() => toggle(o.value)}
              className={`relative h-10 rounded-full border px-4 text-sm transition-colors ${on ? "border-transparent text-void" : "border-line text-soft hover:border-line-strong hover:text-text"}`}
            >
              {on ? <m.span layoutId={multiple ? undefined : `pill-${id}`} transition={spring.snappy} className="absolute inset-0 rounded-full bg-text" /> : null}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>
      {picked.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </Field>
  );
}

export const yesNo = [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }];

const PendingContext = createContext(false);

/**
 * A form that keeps what the person typed when the server says no. React 19 clears an uncontrolled form
 * after every action finishes, which wiped a long listing form on a single error. Submitting through
 * onSubmit and startTransition runs the same server action without that reset.
 */
export function KeptForm({
  action,
  pending,
  className,
  children,
}: {
  action: (data: FormData) => void;
  pending: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      className={className}
      onSubmit={(ev) => {
        ev.preventDefault();
        const data = new FormData(ev.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
    </form>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const status = useFormStatus();
  const keptPending = useContext(PendingContext);
  const pending = status.pending || keptPending;
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 items-center justify-center rounded-full bg-text px-7 text-[15px] font-medium text-void transition-colors hover:bg-white disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function FormMessage({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <p role={error ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${error ? "border-danger/40 text-danger" : "border-ok/40 text-ok"}`}>
      {error ?? ok}
    </p>
  );
}
