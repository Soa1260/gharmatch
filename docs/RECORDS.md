# Account records and deleted accounts

What the review team can look up, how it is controlled, and what happens when someone deletes their account.

## The lookup (`/admin/records`)

- For administrators only. The check is made in `src/server/records.ts`, not only on the page, and uses the same `ADMIN_EMAILS` rule as the rest of the admin area.
- Search by account id, by email, or by a report id (the report points to the person it is about). Misses all give the same answer.
- Every lookup needs a written reason of at least 10 characters (a notice number, a report id and why). The reason, the administrator and the time are saved in `AuditLog` as `CONTACT_DETAILS_VIEWED` **before** anything is shown. If that cannot be saved, nothing is shown.
- The page lists the latest lookups and shows earlier lookups of the same account, so the team can see who has read contact details.
- It shows the name, email and phone, roles, status, dates, ID-check record, reports about the account or its homes or searches, and counts. It never shows who filed a report.
- **Records sheet.** A plain-text summary (`src/lib/recordsSheet.ts`) to paste into a reply to a police, court or regulator request, or to keep with a case. It is a summary of what we hold, not the notice itself and not legal advice. Read it before sending.

## Deleting an account

`src/server/deletion.ts`:

- Name, email, phone, picture and trusted contact are removed at once, and the Google link is deleted. An `ACCOUNT_DELETED` entry goes into `AuditLog` with no personal data.
- **If a report about the person, their homes or their searches is open or upheld (not dismissed)**, a one-way keyed fingerprint of the email (HMAC-SHA256 with `AUTH_SECRET`) is kept in `User.emailHash`. It cannot be turned back into the address. Nothing readable is kept.
- The empty record is removed after 30 days. If it holds a fingerprint it is removed after 365 days (`DELETED_RECORD_DAYS`, `FINGERPRINT_RETENTION_DAYS` in `src/lib/domain.ts`). Anyone who filed a report stays.
- `/admin/records` lists accounts deleted while a report was open or upheld, so the team learns that someone left.

## A return under the same email

When a new account is created (`events.createUser` in `src/auth.ts`), `flagRejoin` compares the email's fingerprint with deleted accounts. A match writes a `REJOIN_AFTER_DELETION` note on the new account. Nothing is blocked: a person decides.

## Limits to know

- After a deleted account's record is purged, or for a deleted account with no fingerprint, we hold **no** name, email or phone, so a later request can only be answered with account ids, reports and saved report copies.
- Rotating `AUTH_SECRET` also changes every fingerprint, so earlier ones stop matching. Fingerprints are kept for a year at most, so the loss is bounded.
- A person can use a different Google address. The fingerprint recognises only the same address.
