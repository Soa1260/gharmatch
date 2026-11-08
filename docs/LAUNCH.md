# Launch checklist

Status as of the pre-launch pass on 9 November 2026. `[x]` is done and checked, `[ ]` is still open.

## Legal and policy
- [x] Terms of Use and Privacy Policy written (community edition) and backed by code. See `docs/LEGAL.md`
- [x] Lawyer review reported as done by the owner. The draft banner on `/terms` and `/privacy` now shows only while a setting is missing
- [x] `NEXT_PUBLIC_GRIEVANCE_OFFICER` and `NEXT_PUBLIC_GRIEVANCE_EMAIL` set as plain variables in Vercel
- [ ] Confirm with your lawyer the open questions in `docs/LEGAL.md`: 24 versus 72 hours, a first-name-only officer, the AGPL with future paid features
- [x] `LICENSE`: GNU AGPL v3. The footer links to the source. Keep the repository public and current with what is deployed
- [ ] Be able to meet the response times the pages promise (24 hours to acknowledge, 15 days to resolve). Someone must read the grievance inbox daily
- [ ] When either document changes, bump `POLICY_VERSION` and `POLICY_UPDATED` in `src/lib/legal.ts`. Everyone is then asked to agree again
- [ ] Review the women-only and men-only listing option with your lawyer
- [ ] Review the discriminatory-term lists in `src/lib/textGuard.ts` with someone who knows Gujarati usage

## Accounts and config
- [x] Neon database with both migrations applied
- [x] Google OAuth client with localhost and live redirect URIs
- [ ] **Google OAuth consent screen: move from Testing to In production.** While it says Testing, only listed test users can sign in, so real people are locked out
- [x] Cloudflare R2 bucket, token and public URL working
- [x] All required environment variables set in Vercel for Production
- [x] Node pinned to 24.x in `package.json`
- [x] Test-only header Sign out button removed. Sign-out is on `/account`
- [ ] `ADMIN_EMAILS` contains at least two people
- [ ] Optional: Resend domain verified (SPF, DKIM) for report and appeal emails
- [ ] Decide on phone-code verification for landlords before real traffic
- [ ] Connect the Vercel GitHub app so pushes deploy by themselves
- [ ] R2: attach a custom domain to the bucket (`r2.dev` addresses are rate-limited)
- [ ] Replace `*.vercel.app` with your own domain when ready, and update `AUTH_URL`, `NEXT_PUBLIC_SITE_URL` and the Google redirect URIs

## Safety
- [ ] Decide who checks `/admin/reports` and how often (daily at least)
- [x] Emergency numbers shown in the safety guide, tap-to-call
- [ ] Verify 112, 1091 and 1930 are current, and the Sakhi centre addresses
- [ ] Test the woman's journey end to end with a woman

## Content
- [x] Sample listings are not shown in production
- [ ] Clear the test data from Neon (listings, searches, interests, visits, reports, audit log). `docs/CLEANUP.md`
- [ ] 20 to 30 real listings seeded with owners' consent (see `docs/SEEDING.md`)

## Limits
- [ ] Vercel Usage page checked weekly: bandwidth, function invocations, Neon compute hours
- [ ] Remember the Hobby plan is non-commercial
