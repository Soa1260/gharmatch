# Legal text: what is in the product, and what a lawyer must check

The Terms of Use (`/terms`) and Privacy Policy (`/privacy`) are the "community edition": written for a free,
open-source project run by one maintainer on free-tier hosting. They were drafted outside this repository and then
adapted so they describe what the app really does. Neither is legal advice, and both stay marked as drafts until a
lawyer signs them off.

## What the code backs up

| Promise in the text | Where it is enforced |
|---|---|
| Explicit agreement, 18+, to Terms and Privacy | Required checkbox on `/onboarding`; date and version saved on the user (`termsAcceptedAt`, `termsVersion`); everyone is asked again after `POLICY_VERSION` changes (`src/lib/legal.ts`, `requireOnboarded`) |
| House-rule snapshot saved when a match is accepted (Terms section 6, Step 2) | `Interest.matchSnapshot`, written in `respondToInterest`; both people read it on the dashboard (`AgreedRulesCard`). Holds no address, phone or email |
| We do not keep copies of IDs or ownership papers | Checks store a type and a date only (`identityCheckedAt`, `ownershipReviewedAt`, `Inspection`). No upload route exists for them. Do not ask people to email documents |
| We do not keep Google's tokens | Cleared on every sign-in (`src/auth.ts`) |
| Phone required to rent out a home | Profile schema and the listing service (`requirePhoneForLandlord`) |
| Account deletion scrubs personal data, shell removed after 30 days | `src/server/deletion.ts`, daily job |
| Usage counts carry no identifiers | `Event` table has a name and a time only |
| Phone and email kept out of logs | Prisma omits them by default; services select them explicitly |

## Choices in the community edition

- **Not "free forever".** Terms 1.1 reserves the right to add optional paid features or fees later, with notice and updated terms, and the Privacy Policy says contact details will still never be sold. This avoids a bait-and-switch claim if hosting costs force a change.
- **Best-effort availability.** Terms 1.2 says nothing is promised when free-tier limits (Vercel Hobby, Neon free) cause slowness, outages or undelivered messages.
- **No street address.** Only `Ahmedabad / Gandhinagar, Gujarat, India` is printed, so a personal home address is never on a public page. The Grievance Officer is the project maintainer, reachable by `NEXT_PUBLIC_GRIEVANCE_EMAIL`.

## Changes made to the drafts so they match the product

- Sign-in is **Google only**, so "magic link" wording was removed.
- The phone number is **required for landlords** (optional for tenants), not optional for everyone.
- Ownership documents reviewed means a **property tax receipt, utility bill, property card or an owner's authorisation letter**, the list the admin form really offers.
- Identity checked means a government photo ID seen **in person or on video** (the two methods the admin form offers).
- Emails today are only about **reports and appeals**. The Privacy Policy says "essential service emails, such as reports and appeals, or critical account and safety notices", which leaves room to add safety notices later, but never marketing.
- The Privacy Policy states users' duties under Section 15 of the DPDP Act (no impersonation, no false information, no false or frivolous reports) and the security measures: HTTPS and server-side access controls.
- The privacy text no longer says data is "encrypted" at providers, which we cannot vouch for.
- It names the maintainer as the **Data Fiduciary**, which the DPDP Act expects a notice to identify.
- It records that **agreement is saved per version** and that **agreed house rules are saved** at acceptance.
- Release (7.2) starts with "to the fullest extent the law allows".

## Questions for the lawyer

1. **Licence.** The repository is under the **GNU AGPL v3** (`LICENSE`, `"license": "AGPL-3.0-only"` in `package.json`), so the Terms' "open source" wording is accurate. Under AGPL section 13, anyone using a modified hosted copy must be offered its source, which is why the footer links to the repository. Two things to confirm: that you hold the copyright to everything in the repo (including anything you accept from contributors later, so consider a contributor agreement), and how the AGPL sits with charging for features in future. It allows selling, but a modified hosted version must publish its source.
2. **Response times.** The text promises acknowledgement in 24 hours, resolution in 15 days, and 72 hours for urgent privacy or impersonation reports. As I read the IT Rules, 2021, complaints about intimate images or impersonation may need action within **24 hours**, and 72 hours relates to helping government agencies. Confirm before launch, and confirm one person can staff it.
3. **The ₹0 liability cap and release (Terms 7).** The cap is "₹0, or if applicable law requires a nominal floor, a maximum of ₹100", so the clause still stands if a court will not enforce a zero cap. Confirm that wording, what holds against consumers, and that an indemnity from users is fine.
4. **Intermediary status** under Section 79 depends on how you behave (due diligence, takedown on notice). Confirm that the admin hold and review features support that.
5. **DPDP Act.** Confirm the notice wording, whether a consent manager or Data Protection Officer is needed at your size, the cross-border statement, and how to handle a nomination request.
6. **An individual as operator.** The Terms are made "with the project maintainer(s)", so you carry personal liability. Ask whether a company or LLP, even a small one, should be named instead.
7. **Mediation Act, 2023**: confirm Step 3 works as a pre-litigation step.
8. **Women-only and men-only listings**: confirm they are lawful and how to describe them.
9. **Police tenant verification**: confirm what applies to landlords in Gujarat and say so in the Terms.
10. **Grievance Officer's name.** The officer is shown as "Ayush", a first name only (`NEXT_PUBLIC_GRIEVANCE_OFFICER`). Ask whether the IT Rules require the full name of a real, identifiable person, and if so, replace it with the full name (a short form such as "Ayush Solanki (SOA)" is fine).

## Where the facts about you come from

`NEXT_PUBLIC_GRIEVANCE_OFFICER` (your name) and `NEXT_PUBLIC_GRIEVANCE_EMAIL` (a real inbox).
They are not invented anywhere in the code. Until they are set, both pages say "[to be filled before launch]".
Set them as plain (not Sensitive) Vercel variables, because `NEXT_PUBLIC_` values are built into the pages.
