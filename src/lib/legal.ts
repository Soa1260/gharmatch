/**
 * Facts the Terms and Privacy Policy state about who runs Gharmatch. They are not invented here: each comes
 * from an environment variable (NEXT_PUBLIC_ so the static legal pages can print them), and anything not
 * set yet shows as a visible placeholder and keeps the "needs review" banner on.
 */

/** Bump when either document changes in a way that needs people to agree again. */
export const POLICY_VERSION = "2026-11-09";
export const POLICY_UPDATED = "9 November 2026";

export const TO_FILL = "[to be filled before launch]";

export interface Operator {
  name: string;
  officer: string;
  email: string;
  address: string;
  domain: string;
  /** Names of settings that are still empty. The pages show a draft banner while this is not empty. */
  missing: string[];
}

export function operator(): Operator {
  // Each variable must be written out in full so Next.js can inline it into the static pages.
  const name = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim();
  const officer = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER?.trim();
  const email = process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL?.trim();
  const address = process.env.NEXT_PUBLIC_OPERATOR_ADDRESS?.trim();
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  let domain: string | undefined;
  try {
    domain = site ? new URL(site).host : undefined;
  } catch {
    domain = undefined;
  }

  const missing = [
    !name && "NEXT_PUBLIC_OPERATOR_NAME",
    !officer && "NEXT_PUBLIC_GRIEVANCE_OFFICER",
    !email && "NEXT_PUBLIC_GRIEVANCE_EMAIL",
    !address && "NEXT_PUBLIC_OPERATOR_ADDRESS",
    !site && "NEXT_PUBLIC_SITE_URL",
  ].filter((v): v is string => Boolean(v));

  return {
    name: name || TO_FILL,
    officer: officer || TO_FILL,
    email: email || TO_FILL,
    address: address || TO_FILL,
    domain: domain || TO_FILL,
    missing,
  };
}
