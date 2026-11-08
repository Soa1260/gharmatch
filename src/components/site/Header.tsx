"use client";

import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { testSignOutAction } from "@/app/actions";
import { duration, ease } from "@/lib/motion";

const links = [
  { href: "/listings", label: "Browse homes" },
  { href: "/#how", label: "How it works" },
  { href: "/safety", label: "Safety" },
];

const POST_HREF = "/listings/new";

/**
 * Plain full-width bar with a hairline. "Post your home" is the one filled button, because landlords are
 * the supply the whole site depends on. Signed-out visitors are sent to sign in and then straight to the form.
 * On phones the links open as a full-screen list and the button stays visible in the bar.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  // null while unknown, so neither "Sign in" nor "Dashboard" flashes the wrong way round.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let live = true;
    fetch("/api/me/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { signedIn?: boolean }) => live && setSignedIn(Boolean(d.signedIn)))
      .catch(() => live && setSignedIn(false));
    return () => {
      live = false;
    };
  }, [pathname]);

  const accountLink = signedIn ? { href: "/dashboard", label: "Dashboard" } : { href: "/signin", label: "Sign in" };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-void/90 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="font-display py-2 text-xl font-semibold tracking-tight" onClick={() => setOpen(false)}>
          gharmatch<span className="text-lamp">.</span>
        </Link>
        <ul className="hidden items-center gap-8 text-sm text-soft md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="transition-colors hover:text-text">{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 sm:gap-3">
          {signedIn === null ? (
            <span className="hidden w-14 sm:block" aria-hidden />
          ) : (
            <Link href={accountLink.href} className="hidden px-2 text-sm text-soft transition-colors hover:text-text sm:block">
              {accountLink.label}
            </Link>
          )}
          {/* TEST ONLY: hidden in production builds. Remove with testSignOutAction before launch. */}
          {signedIn && process.env.NODE_ENV !== "production" ? (
            <form action={testSignOutAction} className="hidden sm:block">
              <button className="px-2 text-sm text-soft transition-colors hover:text-text">Sign out</button>
            </form>
          ) : null}
          <Link
            href={POST_HREF}
            onClick={() => setOpen(false)}
            className="inline-flex h-10 items-center rounded-full bg-lamp px-4 text-sm font-medium text-void transition-colors hover:bg-[#f6c488]"
          >
            Post your home
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
            className="grid size-10 place-items-center rounded-full border border-line md:hidden"
          >
            <span className="font-mono text-xs">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </nav>
      <AnimatePresence>
        {open ? (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } }}
            exit={{ opacity: 0, transition: { duration: duration.quick } }}
            className="border-t border-line bg-void px-6 pb-8 pt-4 md:hidden"
          >
            <ul className="space-y-1">
              {[...links, ...(signedIn === null ? [] : [accountLink]), { href: "/help", label: "Need help now" }].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`font-display block py-3 text-3xl font-semibold tracking-tight ${l.href === "/help" ? "text-danger" : ""}`}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            {signedIn && process.env.NODE_ENV !== "production" ? (
              <form action={testSignOutAction} className="mt-2">
                <button className="font-display block py-3 text-3xl font-semibold tracking-tight text-soft">Sign out</button>
              </form>
            ) : null}
          </m.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
