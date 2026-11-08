"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

const initial: FormState = {};

/** One visit button (check in, check out, cancel) that says why when the app refuses, instead of doing nothing. */
export function VisitActionButton({
  action,
  visitId,
  tone = "ghost",
  children,
}: {
  action: (state: FormState, data: FormData) => Promise<FormState>;
  visitId: string;
  tone?: "solid" | "ghost";
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, initial);
  const cls = tone === "solid" ? "bg-text text-void" : "border border-line-strong text-text hover:bg-raised";
  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="visitId" value={visitId} />
        <button disabled={pending} className={`h-9 rounded-full px-4 text-sm transition-colors disabled:opacity-60 ${cls}`}>
          {pending ? "Working…" : children}
        </button>
      </form>
      {state.error ? <p role="alert" className="mt-2 max-w-xs text-xs leading-relaxed text-danger">{state.error}</p> : null}
      {state.ok ? <p role="status" className="mt-2 max-w-xs text-xs leading-relaxed text-ok">{state.ok}</p> : null}
    </div>
  );
}
