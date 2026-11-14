import { createHmac } from "node:crypto";

/** The key for the fingerprint. Real deployments always have AUTH_SECRET, because sign-in cannot work without it. */
function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "test") return "vitest-only-secret-0123456789abcdef0123";
  throw new Error("AUTH_SECRET is not set");
}

/**
 * A one-way, keyed fingerprint of an email address. The same address always gives the same value, so a return can be
 * recognised, but the address cannot be recovered from it, and without the secret nobody can check a guess.
 */
export function hashEmail(email: string): string {
  return createHmac("sha256", secret()).update(`gharmatch:email-fingerprint:${email.trim().toLowerCase()}`).digest("hex");
}
