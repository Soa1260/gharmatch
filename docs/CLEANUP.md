# Clearing the test data before launch

The walkthrough tests left rows in the Neon database: test listings, searches, interests, visits, a safety report
(which also marks the test landlord account as having an upheld report), audit entries and usage counts. The app's
Delete button only hides rows, so clearing them needs a one-off script that you run yourself.

It keeps every **user account**, and removes the rest. Do this **before** real people use the site, never after.

```bash
node scripts/clear-test-data.mjs          # shows what would be deleted, changes nothing
node scripts/clear-test-data.mjs --yes    # deletes it, in one transaction
```

It reads `DATABASE_URL` from `.env.local`, so it runs against the same database as the live site.
Any photo files in the R2 bucket that belonged to deleted listings are not removed by it. Delete those in the
Cloudflare dashboard under R2, in the `listings/` folder, if you want the bucket empty.
