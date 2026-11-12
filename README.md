# Gharmatch

**Rentals in Ahmedabad and Gandhinagar, matched on house rules.**

🌐 **Live:** [gharmatch.space](https://gharmatch.space) · Free · Open source (AGPL v3) · No broker fee

Finding a rental here often means brokers, endless calls, and learning after a day that the flat is "veg only" or "no bachelors". Gharmatch puts the house rules first. Landlords state their rules, tenants state their needs, and the app shows the fit and any clash before anyone messages.

> **Status:** live and in its early days. Feedback and bug reports are welcome: open an [issue](https://github.com/Soa1260/gharmatch/issues).

## What it does

- **Rules, not who you are.** Landlords post house rules (food, pets, smoking, alcohol, visitors, lease, notice, keys). Tenants post what they need. A transparent, rule-based match score (not AI) shows the fit and flags clashes first.
- **Contacts stay private.** Phone, email and the exact address are revealed only to the two people in an accepted match.
- **No screening on identity.** There are no religion, caste, community, surname or place-of-origin fields, and a text guard blocks them in free text.
- **Safety built in.**
  - Landlords disclose who holds duplicate keys, how much notice they give before entering, and any common-area cameras. Cameras in private spaces are not allowed.
  - Women's and mixed-group searches are masked to landlords until the tenant replies.
  - Anyone can report a listing. Serious reports pause it at once until a person reviews it.
  - Visit planning with check-in and check-out, a trusted contact, and emergency numbers one tap away.
  - A saved copy of the agreed house rules is kept when a match is accepted, for fair dispute handling.
- **Not for brokers.** Each home says who posted it (owner, family member, caretaker or agent) and needs a declaration that the poster may let it and takes no fee. One account can hold at most 5 live or paused homes, and tenants can report "Broker, or a fee was asked for".
- **Google sign-in only,** so every post and report belongs to a real account. Landlords must have a mobile number on file.

Checks and badges are point-in-time records, not guarantees. See the [Terms](https://gharmatch.space/terms) and [Privacy Policy](https://gharmatch.space/privacy).

## Tech

Next.js 16 (App Router, TypeScript) · React 19 · Prisma 7 · PostgreSQL on Neon · Tailwind 4 · Auth.js v5 · Zod · Vitest (PGlite) · Cloudflare R2 · Vercel Hobby + Vercel Web Analytics.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in values, see below
npx prisma migrate deploy    # applies prisma/migrations to DATABASE_URL
npm run dev
```

> **Use your own database.** Point `DATABASE_URL` at a separate Neon project or branch. Never develop against the production database: anything you post locally would appear on the live site.

Without `DATABASE_URL` in development the browse page shows labelled sample homes so the design can be reviewed. That never happens in production.

| Script | What it does |
|---|---|
| `npm run typecheck` | TypeScript, strict |
| `npm run lint` | ESLint |
| `npm test` | Vitest. Database tests run on PGlite, an in-process Postgres, so no database is needed |
| `npm run build` | Generates the Prisma client and builds |

Before opening a pull request, run typecheck, lint, tests and the build. CI runs typecheck, lint, tests and a dependency audit.

## Environment variables

All are validated in `src/lib/env.ts`. See `.env.example`.

| Name | Purpose |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string |
| `AUTH_SECRET`, `AUTH_URL` | Auth.js. Generate the secret with `npx auth secret` |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Google sign-in |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional. Emails to people whose report or appeal was decided. Sign-in is Google only |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` and `/admin/reports` |
| `CRON_SECRET` | Bearer token Vercel Cron sends to `/api/cron/daily` |
| `NEXT_PUBLIC_SITE_URL` | Metadata, sitemap, and the domain named in the legal pages |
| `NEXT_PUBLIC_GRIEVANCE_OFFICER`, `NEXT_PUBLIC_GRIEVANCE_EMAIL` | Who the Terms and Privacy Policy name (no street address is published). Set as plain variables, not Sensitive. See `docs/LEGAL.md` |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Optional free Google Maps Embed API key (restrict it to your site). Without it the keyless embed is used |
| `R2_*` | Cloudflare R2 for photos. Create a bucket with a public URL (custom domain or r2.dev) and an API token limited to that bucket. Without these the site works and photo upload is switched off |

`NEXT_PUBLIC_*` values are baked in at build time, so redeploy after changing them.

## Deploy on Vercel Hobby with Neon

1. **Neon**: create a project in the closest region. Copy the *pooled* connection string. Run `npx prisma migrate deploy` once against it from your machine.
2. **Google**: create an OAuth client. Authorised redirect URI: `https://<your-domain>/api/auth/callback/google`. Move the consent screen from Testing to In production, or only listed test users can sign in.
3. **Resend** (optional): add and verify a sending domain, create an API key. Only report and appeal emails use it.
4. **Vercel**: import the repository, add every variable from the table above (Production and Preview), deploy. `vercel.json` pins the `bom1` region and registers one daily cron. Pushes to `main` deploy automatically.
5. Open `/api/health`, then sign in with an email in `ADMIN_EMAILS` and open `/admin/reports`.

**Database changes:** the build does not run migrations. When a change adds a migration, run `npx prisma migrate deploy` against the production database **before** pushing the code that needs it.

### Staying inside Hobby limits

- Public pages (home, listing detail, sitemap) are cached. The listing page revalidates hourly and personal match data loads from a small no-store endpoint, so shared links do not wake the database.
- Sessions are JWTs, so a page view does not query the database. Services re-check the account for every write.
- Photos are shrunk in the browser to about 1280 px WebP (under 400 KB), checked again on the server by their real bytes, stored on R2 (no egress fees) and served as plain files, not through the image optimizer.
- One daily cron (the Hobby maximum). Listings expire there, and the dashboard shows the “Still available” button, which saves email quota.
- Hobby is for personal, non-commercial use. Charging money or taking referral fees means moving to Pro.

## How it is built

- `src/lib/matching.ts`: pure scoring with reasons and hard conflicts.
- `src/lib/textGuard.ts`: rejects religion, caste, community and origin as screening, holds surnames for review.
- `src/lib/safety.ts`: contact-info detection, invite rules, masked view of women's searches.
- `src/server/*`: services. Every function takes the actor and authorises inside, so no route can skip it.
- `src/server/contacts.ts`: the only place that reads another person's email or phone.
- Prisma client omits `email` and `phone` by default; services select them explicitly.
- Design rules in `docs/DESIGN.md`, motion rules in `docs/MOTION.md`.

## Docs

`docs/LEGAL.md` what the code backs up, and open questions for a lawyer · `docs/INCIDENTS.md` response procedures · `docs/VERIFICATION.md` checks and inspections · `docs/SAFETY.md` what safety is built, what is not, and the staffing it needs · `docs/QA.md` manual checklist · `docs/LAUNCH.md` launch checklist · `docs/SEEDING.md` cold start · `docs/CLEANUP.md` clearing test data · `docs/MAINTENANCE.md` switching the maintenance page on and off · `docs/REDDIT.md` posts · `docs/VALIDATION.md` 30-day numbers · `docs/RISKS.md` limitations and risks.

## Reporting a problem

- **Unsafe or fraudulent listing:** use the Report button on the listing.
- **Privacy or legal concerns:** write to the grievance contact named on the [Terms](https://gharmatch.space/terms#grievance) page.
- **Security issue in the code:** please email the grievance contact rather than opening a public issue.
- **Bugs and ideas:** [open an issue](https://github.com/Soa1260/gharmatch/issues).

## Licence

Gharmatch is free software under the **GNU Affero General Public License v3** (`LICENSE`). You may use, study, change and share it. If you run a modified version as a service that other people use over a network, the AGPL requires you to offer them the source of your version under the same licence. The site footer links to this repository for that reason. Copyright the Gharmatch contributors.
