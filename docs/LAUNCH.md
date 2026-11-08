# Launch checklist

## Legal and policy (blockers)
- [ ] A lawyer reads `docs/LEGAL.md` and reviews `/privacy` and `/terms`, then remove the `draft` banner from both pages
- [ ] Set `NEXT_PUBLIC_OPERATOR_NAME`, `NEXT_PUBLIC_GRIEVANCE_OFFICER`, `NEXT_PUBLIC_GRIEVANCE_EMAIL` and `NEXT_PUBLIC_OPERATOR_ADDRESS` as plain variables in Vercel. The pages show "[to be filled before launch]" until you do
- [ ] Be able to meet the response times the pages promise (24 hours to acknowledge, 15 days to resolve). Someone must read the grievance inbox daily
- [ ] When either document changes, bump `POLICY_VERSION` and `POLICY_UPDATED` in `src/lib/legal.ts`. Everyone is then asked to agree again
- [ ] Decide on the legal entity operating the service. The terms name the operator and set Ahmedabad / Gandhinagar courts
- [ ] Review the women-only and men-only listing option with your lawyer
- [ ] Review the discriminatory-term lists in `src/lib/textGuard.ts` with someone who knows Gujarati usage

## Accounts and config
- [ ] Neon production project, migrations applied, backups understood (free tier history is short)
- [ ] Google OAuth consent screen published, production redirect URI added
- [ ] Optional: Resend domain verified (SPF, DKIM) for report and appeal emails. Sign-in is Google only, so nobody is locked out without it
- [ ] Decide on phone-code verification for landlords before real traffic: Google accounts are free to create, so Google-only sign-in is not strong accountability on its own
- [ ] All environment variables set in Vercel for Production
- [ ] Remove the test-only header **Sign out** button: `testSignOutAction` in `src/app/actions.ts` and the two `NODE_ENV !== "production"` blocks in `src/components/site/Header.tsx`. It is already hidden in production builds, so this is cleanup. Sign-out stays on `/account`
- [ ] `ADMIN_EMAILS` contains at least two people
- [ ] Replace `*.vercel.app` with your own domain when ready, and update `AUTH_URL` and `NEXT_PUBLIC_SITE_URL`

## Safety
- [ ] You have read the first 20 reports process: who checks `/admin/reports` and how often (daily at least)
- [ ] A phone number for emergencies (112) is shown in the safety guide
- [ ] Test the woman's journey end to end with a friend

## Content
- [ ] Sample listings are not shown in production (they are not, but confirm)
- [ ] 20 to 30 real listings seeded with owners' consent (see `docs/SEEDING.md`)

## Limits
- [ ] Vercel Usage page checked weekly: bandwidth, function invocations, Neon compute hours, Resend sends
- [ ] Remember the Hobby plan is non-commercial
