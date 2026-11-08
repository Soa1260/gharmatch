# Known limitations and risks

## Not built yet
- **Photos are untested against real R2.** Upload, delete and cover change are built and tested with an in-memory store, but not against a real bucket. Test with a real Cloudflare R2 bucket before launch (see README).
- **Notifications.** No emails for new interests or answers. People check the dashboard. A daily digest is the planned fix.
- **Photos moderation, phone verification, admin tools beyond reports.** Out of MVP scope.
- **Hindi and Gujarati interface.** English only.

## Security trade-offs
- **CSP allows `'unsafe-inline'` for scripts.** A nonce or hash policy would force every page to render per request and defeat caching on the Hobby plan. No `unsafe-eval` in production. Revisit if the site moves to a paid plan.
- **Rate limiting is Postgres-based.** It is simple and cheap but adds database writes per action. The `RateLimiter` interface lets you swap in Upstash.
- **Sessions are JWTs.** A banned user's token keeps working until it expires (14 days) for read-only pages, but every write re-checks the account in the database.
- **Free-text screening is a word list.** It will miss creative wording and flag some false positives. Admin review and the report button are the second layer.

## Safety limits
See `docs/SAFETY.md` for what the product does and cannot do. The largest remaining risk is not code: reports must be answered quickly by a person, every day.

## Legal and product risk
- **Hobby plan is non-commercial.** Any revenue means Pro.
- **Gender-restricted homes.** Women-only and men-only homes are common, but check with a lawyer.
- **“Bachelors” and “family” as household types** are commonly used and can still be perceived as discriminatory. They are practical categories here, not identity ones, but keep an eye on reports.
- **Liability.** The site introduces people and verifies only email. The terms say so. A scam or an unsafe visit will still reflect on you, so respond to reports quickly.
- **DPDP Act and similar rules.** The privacy policy is a draft and has not been reviewed.
- **Cold start.** Without seeded listings the product is empty. See `docs/SEEDING.md`.
- **Neon free tier.** Short backup history and 0.5 GB. Export data regularly.
