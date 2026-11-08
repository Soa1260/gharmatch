/**
 * The database address to hand to the `pg` driver.
 *
 * Neon and most guides give a string ending in `sslmode=require`. The driver already treats `require`, `prefer`
 * and `verify-ca` as `verify-full` (full certificate and host checking), and prints a security warning on every
 * start because that meaning changes in its next major version. Saying `verify-full` outright keeps exactly the
 * behaviour we run today, silences the warning, and cannot weaken anything when the driver is upgraded.
 */
const ALIASED = new Set(["require", "prefer", "verify-ca"]);

export function databaseUrl(raw: string | undefined = process.env.DATABASE_URL): string | undefined {
  if (!raw) return raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw; // not a URL we understand: let the driver report the real problem
  }
  const mode = url.searchParams.get("sslmode");
  // An explicit libpq-compatibility request is a deliberate choice: leave it alone.
  if (mode && ALIASED.has(mode) && !url.searchParams.has("uselibpqcompat")) {
    url.searchParams.set("sslmode", "verify-full");
    return url.toString();
  }
  return raw;
}
