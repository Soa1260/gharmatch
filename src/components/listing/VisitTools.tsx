"use client";

import { useEffect, useState } from "react";
import { visitShareText } from "@/lib/safety";

const CHECKLIST = [
  "Someone I trust knows the address and the time",
  "I am going in daylight, or with a person",
  "I met the owner or agent at the gate first",
  "I checked the entry, the lane and the stairs",
  "I have not paid or promised any money",
  "I know where the exit is and my phone is charged",
];

/**
 * Two small tools for the day of a visit: send a plan to someone you trust, and tick a checklist.
 * Nothing is stored. The only data used is the trusted contact saved on your own account.
 */
export function VisitTools({ title, area, slug }: { title: string; area: string; slug: string }) {
  const [contact, setContact] = useState<{ name: string; phone: string } | null>(null);
  const [when, setWhen] = useState("");
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState<boolean[]>(() => CHECKLIST.map(() => false));

  useEffect(() => {
    const ctl = new AbortController();
    fetch("/api/me/safety", { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : { contact: null }))
      .then((j: { contact: { name: string; phone: string } | null }) => setContact(j.contact))
      .catch(() => undefined);
    return () => ctl.abort();
  }, []);

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const text = visitShareText({ title, area, when: when || undefined, url: `${origin}/listings/${slug}` });
  const digits = contact?.phone.replace(/\D/g, "").slice(-10);
  const wa = `https://wa.me/${digits ? `91${digits}` : ""}?text=${encodeURIComponent(text)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-line bg-surface p-6">
      <div>
        <p className="font-display text-xl font-semibold tracking-tight">Going to see it?</p>
        <p className="mt-2 text-sm text-soft">Tell someone you trust before you go. It takes ten seconds.</p>
        <label className="mt-4 block text-sm text-soft">
          Visit time (optional)
          <input
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            placeholder="Saturday 5 pm"
            maxLength={40}
            className="mt-2 h-11 w-full rounded-xl border border-line bg-void px-4 text-[15px] placeholder:text-faint focus:border-lamp focus:outline-none"
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full bg-text px-5 text-sm font-medium text-void">
            {contact ? `Send to ${contact.name}` : "Share on WhatsApp"}
          </a>
          <button type="button" onClick={copy} className="h-11 rounded-full border border-line-strong px-5 text-sm hover:bg-raised">
            {copied ? "Copied" : "Copy message"}
          </button>
        </div>
        {!contact ? <p className="mt-3 text-xs text-faint">Save a trusted contact on your account page and this button sends straight to them.</p> : null}
      </div>

      <fieldset>
        <legend className="index mb-3">Visit checklist</legend>
        <ul className="space-y-2">
          {CHECKLIST.map((item, i) => (
            <li key={item}>
              <label className="flex cursor-pointer items-start gap-3 py-1.5 text-sm text-soft">
                <input
                  type="checkbox"
                  checked={done[i]}
                  onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
                  className="mt-0.5 size-4 shrink-0 accent-[var(--color-lamp)]"
                />
                <span className={done[i] ? "text-text" : ""}>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </div>
  );
}
