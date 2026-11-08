# Legal text: what is in the product, and what a lawyer must check

The Terms of Use (`/terms`) and Privacy Policy (`/privacy`) were drafted outside this repository and then adapted so
they describe what the app really does. Neither is legal advice, and both stay marked as drafts until a lawyer
signs them off.

## What the code now backs up

| Promise in the text | Where it is enforced |
|---|---|
| Explicit agreement, 18+, to Terms and Privacy | Required checkbox on `/onboarding`; date and version saved on the user (`termsAcceptedAt`, `termsVersion`); everyone is asked again after `POLICY_VERSION` changes (`src/lib/legal.ts`, `requireOnboarded`) |
| House-rule snapshot saved when a match is accepted (Terms clause 8, Tier 2) | `Interest.matchSnapshot`, written in `respondToInterest`; both people read it on the dashboard (`AgreedRulesCard`). Holds no address, phone or email |
| We do not keep copies of IDs or ownership papers | Checks store a type and a date only (`identityCheckedAt`, `ownershipReviewedAt`, `Inspection`). No upload route exists for them. Do not ask people to email documents |
| We do not keep Google's tokens | Cleared on every sign-in (`src/auth.ts`) |
| Phone required to rent out a home | Profile schema and the listing service (`requirePhoneForLandlord`) |
| Account deletion scrubs personal data, shell removed after 30 days | `src/server/deletion.ts`, daily job |
| Usage counts carry no identifiers | `Event` table has a name and a time only |
| Phone and email kept out of logs | Prisma omits them by default; services select them explicitly |

## Changes made to the original draft so it matches the product

- Sign-in is **Google only**, so the "magic link" wording was removed.
- Ownership documents reviewed means a **property tax receipt, utility bill, property card or an owner's authorisation letter**, the list the admin form really offers. The draft named a sale deed index.
- Identity checked means a government photo ID seen **in person or on video** (the two methods the admin form offers).
- Emails are sent only about **reports and appeals**, not for matches or listing expiry, so the privacy text says that.
- Clause 9.2 (release) now starts with "to the extent the law allows", because a blanket release of injury claims is unlikely to hold.
- "Gujarat Police regulations" became "local police rules": I could not confirm the exact rule.

## Questions for the lawyer

1. **Response times.** The text promises acknowledgement in 24 hours, resolution in 15 days, and 72 hours for impersonation, privacy and surveillance complaints. As I read the IT Rules, 2021, complaints about intimate images or impersonation may need action within **24 hours**, and 72 hours relates to helping government agencies. Confirm before launch, and confirm you can staff it.
2. **Intermediary status** under Section 79 depends on how you actually behave (due diligence, takedown on notice). Confirm that the admin hold and review features support that.
3. **Liability cap and release** (clauses 9 and 10): confirm what holds against consumers, and that a ₹100 cap and an indemnity are acceptable.
4. **DPDP Act.** Confirm the notice wording, whether a consent manager or Data Protection Officer is needed at your size, the cross-border statement, and how to handle a nomination request.
5. **Mediation Act, 2023**: confirm the Tier 3 wording works as a pre-litigation step.
6. **Women-only and men-only listings**: confirm they are lawful and how to describe them.
7. **Police tenant verification**: confirm what applies to landlords in Gujarat and say so in the Terms.

## Where the facts about you come from

`NEXT_PUBLIC_OPERATOR_NAME`, `NEXT_PUBLIC_GRIEVANCE_OFFICER`, `NEXT_PUBLIC_GRIEVANCE_EMAIL` and `NEXT_PUBLIC_OPERATOR_ADDRESS`.
They are not invented anywhere in the code. Until they are set, both pages say "[to be filled before launch]".
