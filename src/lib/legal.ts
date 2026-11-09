/**
 * Facts the Terms and Privacy Policy state about who runs Gharmatch. They are not invented here: each comes
 * from an environment variable (NEXT_PUBLIC_ so the static legal pages can print them), and anything not
 * set yet shows as a visible placeholder and keeps the "needs review" banner on.
 *
 * No street address is published on purpose. Only the city and state appear, so a personal home address
 * never ends up on a public page.
 */

/** Bump when either document changes in a way that needs people to agree again. */
export const POLICY_VERSION = "2026-11-09.4";
export const POLICY_UPDATED = "9 November 2026";

export const TO_FILL = "[to be filled before launch]";
export const LOCATION = "Ahmedabad / Gandhinagar, Gujarat, India";
export const REPO_URL = "https://github.com/Soa1260/gharmatch";

export interface Operator {
  /** The project maintainer who is also the Grievance Officer. */
  officer: string;
  email: string;
  /** Names of settings that are still empty. The pages show a draft banner while this is not empty. */
  missing: string[];
}

export function operator(): Operator {
  // Each variable must be written out in full so Next.js can inline it into the static pages.
  const officer = process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER?.trim();
  const email = process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL?.trim();

  const missing = [!officer && "NEXT_PUBLIC_GRIEVANCE_OFFICER", !email && "NEXT_PUBLIC_GRIEVANCE_EMAIL"].filter(
    (v): v is string => Boolean(v),
  );

  return { officer: officer || TO_FILL, email: email || TO_FILL, missing };
}
