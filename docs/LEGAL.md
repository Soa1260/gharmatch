# Legal and privacy architecture: what the code backs up

The Terms of Use (`/terms`) and Privacy Policy (`/privacy`) are the "community edition", written for a free,
open-source project on free-tier hosting. This page maps what they promise to the code that
enforces it. It is not legal advice.

## What the code backs up

| Promise in the text | Where it is enforced |
|---|---|
| Explicit agreement, 18+, to Terms and Privacy | Required checkbox on `/onboarding`; date and version saved on the user (`termsAcceptedAt`, `termsVersion`); everyone is asked again after `POLICY_VERSION` changes (`src/lib/legal.ts`, `requireOnboarded`) |
| House-rule snapshot saved when a match is accepted (Terms section 6, Step 2) | `Interest.matchSnapshot`, written in `respondToInterest`; both people read it on the dashboard (`AgreedRulesCard`). Holds no address, phone or email |
| We do not keep copies of IDs or ownership papers | Checks store a type and a date only (`identityCheckedAt`, `ownershipReviewedAt`, `Inspection`). No upload route exists for them. Do not ask people to email documents |
| We do not keep Google's tokens | Cleared on every sign-in (`src/auth.ts`) |
| Phone required to rent out a home | Profile schema and the listing service (`requirePhoneForLandlord`) |
| No brokers, no fees (Terms 1.3A) | Each home needs a "posted by" choice and a declaration (`Listing.postedBy`, `authorisationDeclaredAt`, `requireDeclaration`); at most 5 live or paused homes per account (`MAX_LIVE_LISTINGS`, also checked when a home is brought back); tenants can report "Broker, or a fee was asked for". The app cannot prove who an owner is, so this rests on the declaration, reports and the daily check of `/admin/reports` |
| Landlord tools: trust card, screening questions, request rules | The card shows facts only: account age, ID checked or not (`identityCheckedAt`), upheld reports (ACTIONED reports on the person or their searches). It is shown to the landlord who received the request and nobody else (`listMyInterests`). Screening answers are saved with the interest (`Interest.screening`). The privacy policy now says a landlord sees this card, including for women's and mixed searches (`POLICY_VERSION` 2026-11-14.1, then 2026-11-14.2 for the fingerprint and lookup wording). |
| Account deletion scrubs personal data, shell removed after 30 days | `src/server/deletion.ts`, daily job |
| Admin lookup of contact details is controlled and logged; a deleted account leaves only a one-way email fingerprint when a report was open or upheld | `src/server/records.ts` (admin check, written reason, `AuditLog` row written first), `src/server/deletion.ts` (`emailHash`, 30-day and 365-day removal), `src/server/rejoin.ts`. See `docs/RECORDS.md` |
| Usage counts carry no identifiers | `Event` table has a name and a time only |
| Phone and email kept out of logs | Prisma omits them by default; services select them explicitly |

## Choices in the community edition

- **Not "free forever".** Terms 1.1 reserves the right to add optional paid features or fees later, with notice and updated terms, and the Privacy Policy says contact details will still never be sold. This avoids a bait-and-switch claim if hosting costs force a change.
- **Best-effort availability.** Terms 1.2 says nothing is promised when free-tier limits (Vercel Hobby, Neon free) cause slowness, outages or undelivered messages.
- **No street address.** Only `Ahmedabad / Gandhinagar, Gujarat, India` is printed, so a personal home address is never on a public page. The Grievance Officer is a project maintainer, reachable by `NEXT_PUBLIC_GRIEVANCE_EMAIL`.

## How the text was matched to the product

- Sign-in is **Google only**, so "magic link" wording was removed.
- The phone number is **required for landlords** (optional for tenants), not optional for everyone.
- Ownership documents reviewed means a **property tax receipt, utility bill, property card or an owner's authorisation letter**, the list the admin form really offers.
- Identity checked means a government photo ID seen **in person or on video** (the two methods the admin form offers).
- Emails today are only about **reports and appeals**. The Privacy Policy says "essential service emails, such as reports and appeals, or critical account and safety notices", which leaves room to add safety notices later, but never marketing.
- The Privacy Policy states users' duties under Section 15 of the DPDP Act (no impersonation, no false information, no false or frivolous reports) and the security measures: HTTPS and server-side access controls.
- The privacy text no longer says data is "encrypted" at providers, which we cannot vouch for.
- It names a project maintainer as the **Data Fiduciary**, which the DPDP Act expects a notice to identify.
- It records that **agreement is saved per version** and that **agreed house rules are saved** at acceptance.
- Release (7.2) starts with "to the fullest extent the law allows".

## Where the facts about you come from

`NEXT_PUBLIC_GRIEVANCE_OFFICER` (your name) and `NEXT_PUBLIC_GRIEVANCE_EMAIL` (a real inbox).
They are not invented anywhere in the code. Until they are set, both pages say "[to be filled before launch]".
Set them as plain (not Sensitive) Vercel variables, because `NEXT_PUBLIC_` values are built into the pages.
