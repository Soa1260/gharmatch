# Safety: what is built, what is not, and what needs people

Safety comes first here. This document sorts every safety capability into six honest categories. A feature appears under "implemented" only if the code exists and the claim was checked. Nothing planned is described as existing. No product can promise that nothing will go wrong. We reduce risk, act fast, keep evidence, and say plainly what we cannot do.

Last reviewed against the code: 8 Nov 2026.

## 1. Implemented and tested (automated tests)

### Privacy and contact
- Phone and email are returned only for an ACCEPTED interest and only to its two parties (`src/server/contacts.ts`).
- The exact address and map pin follow the same rule (`getLocationForInterest`). Publicly only an approximate point (about 1 km grid) is exposed, and a test proves the exact coordinates and address never appear in public output.
- Women and mixed-group searches appear to landlords as "Verified tenant": no name, no free-text intro, rounded budget.
- Messages cannot contain phone numbers, emails, links or handles, and cannot discuss payments (advance, token, UPI, bank details).
- Account deletion removes name, phone, email, trusted contact and sign-in links.

### Location
- A listing needs a Google Maps link or coordinates. The server extracts the point, checks it lies inside the chosen city's bounds, and compares it with the chosen area. A pin far from the area holds the listing for review.
- Short `maps.app.goo.gl` links are followed only to an allowlist of Google hosts, a few hops at most.
- **What this proves:** the point is a real place in the right part of the city. **It does not prove** the landlord owns it, lives there, or that a particular building exists there. The page says so.

### Property safety assessment
- 13 items (main door, locks, windows, balcony, entrance, CCTV, lighting, visitor management, intercom, emergency exits, fire safety, parking, building access). Each shows one of three statuses: Verified by platform, Declared by landlord, Not available / not verified.
- "Verified by platform" appears only if an admin recorded an inspection with a date and ticked that item. No inspection, no verified item and no inspection line.
- CCTV declared means camera locations and who sees recordings are required, plus a confirmation that there are no cameras in bedrooms, bathrooms or private spaces. Reports exist for hidden cameras.
- Disclosures: who else lives here, owner on site, duplicate keys, when the owner may enter and the notice required, visitors.

### Three separate indicators (never merged)
- Identity Checked (a person saw photo ID, in person or on video, date recorded, no ID number kept).
- Ownership Documents Reviewed (document type and date, document not kept).
- Property Physically Inspected (date, items verified).
- Admin-only, enforced inside the service, every change written to an audit log.
- There is no "Verified landlord" or "safe property" label anywhere.

### Incidents
- Eleven categories including physical threat or stalking, unauthorized entry, hidden cameras, suspicious representative, financial fraud and occupancy violation.
- Severity: critical and high reports pause the listing at once as a precaution (a hold, not a finding). Medium pauses on two different reporters.
- Reports record the time of the incident, a saved copy of the reported item and the reporter's messages with it, and cannot be erased by editing or deleting.
- Status flow Open, Under review, Actioned or Dismissed, each with a recorded reason, audit log, and a plain email to the reporter without details.
- Appeals: the owner can appeal a hold, an admin decides, an upheld appeal lifts it.
- Fair-process safeguards: a reporter with 3 or more dismissed reports in 30 days no longer triggers automatic holds; an edit can never lift a hold; holds are visible to the owner and appealable.
- A landlord with an upheld safety report cannot invite women or mixed groups. Women-only homes need a phone number on file.

### Visits
- Visits can be requested only after acceptance, by the visitor. The owner confirms and must name the person who will meet the visitor and their relationship.
- Check-in only within a window of the visit time, only by the visitor. Check-out, cancel by either side, history for both.
- Calendar file for the two parties, with the area and never the exact address.
- A visitor can bring a companion (recorded), and share a ready message with a saved trusted contact by pressing send.

### Other
- Scam wording holds a listing for review. Rate limits on sign-in, listings, interests, invitations, reports and uploads.

## 2. Implemented but not fully tested
- **Screens.** The listing page, directory, home page and filters were checked in a browser at desktop and 375 px wide. The dashboard, forms, admin pages and visit screens were type-checked and their services tested, but not clicked through against a real database and sign-in.
- **Map embed.** The keyless Google embed loaded in a test browser, but it is not an officially documented endpoint. Setting `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` (free Embed API) switches to the official one.
- **Short-link resolution** is tested with a fake network, not against live Google.
- **Email to reporters and appellants** is tested with a recording notifier, not sent through Resend.
- **Photo upload** is tested against an in-memory store, not a real R2 bucket.
- **Area centres** used for the "far from the area" check are rough values from general knowledge, not surveyed data. They are a soft check that only holds a listing, never rejects it. Have someone who knows the neighbourhoods review them.

## 3. Planned (not built)
- Mobile OTP verification.
- Document upload with secure storage, encryption and scheduled deletion. Today documents are looked at and not stored, by process (see `VERIFICATION.md`).
- **Automatic** missed-check-out handling: reminder, configurable wait, then notify the trusted contact. Not built, because it needs a scheduler that runs every few minutes and an SMS or WhatsApp channel, and a silent failure would give false reassurance. The current check-in and check-out are for the visitor and the person they choose to tell. Gharmatch does not watch them.
- Automatic visit reminders by message (only a calendar file exists).
- In-app maintenance-visit notices and tenant consent.
- Curated neighbourhood information. Today the page links to live map searches for police, hospitals, pharmacies, bus stops and metro.
- Street-lighting inspection status.
- Female inspection representatives, a women-verified network, independent audits.
- A reporter-facing incident history page.

## 4. Requires human operational support
- Reviewing the report queue, at least twice a day, critical reports within an hour in daytime. Phone alerts on the admin email.
- Doing the identity checks, ownership reviews and physical inspections that make the indicators true.
- Deciding appeals, and contacting police where a crime is alleged.
- Re-checking the support directory at least every three months.
- Testing the women's flow with real women before launch.

## 5. Requires external government or third-party services
- 112, 181, 1091, 108, 1098, 1930 and Sankat Sakhi are government services. We link and list them, with the source and the date we checked (`/help/directory`). We read 181, 1098, 108 and 1090 on official pages (two of those pages were out of date), and have **not** confirmed 112, 1091 or 1930 ourselves. Sakhi One Stop Centre addresses were not on the pages we could read.
- Google Maps (embed and links), Resend (email), Cloudflare R2 (photos), Neon (database), Vercel (hosting and one daily job).
- An SMS provider and DLT registration if OTP is added.

## 6. Requires legal review
- Privacy policy and DPDP Act and Rules compliance, retention periods, and handling of police and court requests.
- Terms, platform liability and consumer protection.
- Women-only and men-only homes, and the policy for transgender women and gender-diverse applicants. The rule today is that eligibility is declared and there is no invasive gender verification. A lawyer must confirm the wording.
- CCTV rules and disclosure wording, and owner-access and key clauses for the rental agreement (a Gujarat lawyer should draft the agreement clauses).
- Identity checks, what may be recorded, and for how long.

## What we cannot do
- Verify that a landlord owns a home from a map pin, or that a tenant is who they say.
- Send help to anyone, or watch a visit. We tell people whom to call.
- See what happens in a private meeting or on WhatsApp.
- Promise a home is safe. Do not use "verified landlord", "100% safe" or "safe for women".
