# Maintenance mode

When you need the site offline for a short while (a database change, a risky release, an outage you are fixing),
switch maintenance mode on. Every visitor, on every path, sees one friendly page instead of the app.

## What visitors get

- Any page address returns the maintenance page, with HTTP **503** and a `Retry-After` header, so search engines
  treat it as temporary and do not drop your pages. The page asks people to check again, refreshes itself every
  two minutes, shows the emergency numbers, and gives the contact email.
- Any `/api/...` address returns a small JSON message with the same 503.
- Still working during maintenance: `/api/health`, the daily cleanup job (`/api/cron/daily`, which keeps its own
  secret), `robots.txt` and the site icons.
- Signed-in people cannot get past it, including admins. That is on purpose: nothing in the app can change while
  you work on it.

## How it works

- `next.config.ts` adds rewrites **only when `MAINTENANCE_MODE=1` at build time**. Otherwise it adds nothing, so
  normal traffic pays no extra cost and uses no extra function invocations on the Hobby plan.
- The rewrites point at `src/app/maintenance/route.ts` (pages) and `src/app/maintenance/json/route.ts` (API).
  Outside maintenance mode those two addresses return 404.
- The page itself is `src/lib/maintenancePage.ts`: plain HTML, no script, no outside files, so it shows even if
  the database is down. Edit the wording there.

## Turn it on

1. Vercel, project **gharmatch**, **Settings, Environment Variables**. Add `MAINTENANCE_MODE` with the value `1`
   for **Production**.
2. **Redeploy** the latest production deployment (Deployments, the three dots, Redeploy). The value is read when
   the site is built, so it only reaches a new deployment. This usually takes under a minute.
3. Open the site in a private window to check you see the maintenance page.

## Turn it off

1. Delete the `MAINTENANCE_MODE` variable (or change it to anything other than `1`).
2. Redeploy again, then check the site is back.

Do the work you need (for example `npx prisma migrate deploy`) **between** the two redeploys.

## Good to know

- Only the exact value `1` switches it on. `true` or `yes` do nothing.
- Pushing code to `main` also redeploys, and keeps whatever the variable is set to. Do not forget to remove it.
- Want it switched without a redeploy, or an admin bypass? That needs a small store read at request time, such as
  Vercel Edge Config. Not set up, because this is enough for a project this size.
- Test it locally with `MAINTENANCE_MODE=1 npm run build` then `MAINTENANCE_MODE=1 npm start`.
