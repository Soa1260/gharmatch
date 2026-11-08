# Manual QA checklist

Run against a Neon dev branch with real Google credentials (Resend is optional, for report emails). Use three accounts: landlord, tenant (man), tenant (woman).

## Sign-in
- [ ] Google sign-in works and lands on onboarding
- [ ] The sign-in page offers Google only (no email field), and a signed-in account shows as email verified in admin
- [ ] `/api/auth/signin/resend` no longer works
- [ ] A new account cannot continue without ticking the "18 or older, agree to Terms and Privacy" box, and the date is saved
- [ ] Bumping `POLICY_VERSION` makes a signed-in user agree again before reaching the dashboard
- [ ] After an interest is accepted, both people see "Rules agreed at acceptance". Editing the listing afterwards does not change it
- [ ] `/terms` and `/privacy` show no `[to be filled before launch]` once the two grievance variables are set, and no street address appears anywhere
- [ ] Onboarding rejects no role and a bad mobile number
- [ ] Choosing "Rent out a home" without a mobile number is refused. Tenants can leave it empty
- [ ] A landlord with no number on file who opens Post your home is sent to the profile page first, and the form is prefilled

## Landlord
- [ ] Post a home. It appears on `/listings` and its page shows no phone, email or exact address
- [ ] Description containing “only Hindu family” is rejected with the policy message
- [ ] Description containing “Patel Colony” publishes but is held, and does not show publicly until approved in admin
- [ ] Pause, resume, delete. “Still available” appears within 5 days of expiry
- [ ] Sixth listing in a day is refused

## Photos and editing
- [ ] After posting, you land on the edit page and can add photos
- [ ] A 6 MB phone photo uploads (it is shrunk first); a PNG renamed .jpg or an SVG is refused
- [ ] Sixth photo is refused; Make cover moves a photo to the front; Remove deletes it from the bucket
- [ ] Browse card slider: swipe on a phone, arrows and dots on desktop, tapping a photo opens the listing
- [ ] Edit home and edit search save and show the new values

## Filters
- [ ] More filters: tick several options in one group (OR) and across groups (AND), Apply, then share the URL and it reproduces the result
- [ ] Security filter requires every ticked feature

## Tenant
- [ ] Post a search as a man and as a woman
- [ ] On a veg-only home, a non-veg search shows the clash before any message
- [ ] A men's search cannot send interest to a women-only home, even with the checkbox
- [ ] Interest message containing a phone number or link is refused
- [ ] Second interest for the same home and search is refused

## Reveal and safety
- [ ] Landlord sees interest, accepts, and both dashboards now show the other's phone and email
- [ ] Before accepting, neither side can see them (check the page source too)
- [ ] The woman's search shows to landlords as “Verified tenant” with no intro
- [ ] A landlord without a phone on file cannot invite her; the fourth invite in a day is refused
- [ ] Block ends a pending conversation and hides contacts both ways
- [ ] Report a listing as Harassment. It appears first in `/admin/reports`
- [ ] A non-admin visiting `/admin/reports` is redirected

## Account and data
- [ ] Delete account: name, phone, email vanish, listings disappear, sign-in no longer works
- [ ] Daily cron with the right bearer token returns counts; without it returns 401

## Safety
- [ ] Report a listing as “I need help now”: it pauses at once, shows the emergency numbers, and appears first with a saved copy in admin
- [ ] Edit the reported listing afterwards: the saved copy in admin is unchanged
- [ ] Two different people report a listing as Other: it pauses
- [ ] A message with “gpay” or “token amount” is refused; a listing saying “no need to visit, pay token” is held
- [ ] A women-only home without a phone on file cannot be posted
- [ ] Save a trusted contact; on a listing, “Send to” that person opens WhatsApp with the message
- [ ] A woman's search shows as “Verified tenant” with no intro on the board
- [ ] The 4 emergency numbers tap-to-call on a real phone

## Location, assessment and visits
- [ ] Post a home with a Google Maps link, a short maps.app.goo.gl link, and plain coordinates: all give the right pin
- [ ] A link with no coordinates, and a pin in Mumbai, are refused with a clear message
- [ ] A pin 15 km from the chosen area publishes but is held for review
- [ ] Public page shows an approximate map and the Show map button; no exact address anywhere; after acceptance the tenant sees the address and Open in Google Maps
- [ ] The assessment shows 13 items, each Declared, Not available, or Verified (only after an admin records an inspection with a date)
- [ ] CCTV ticked without camera places, who sees recordings, and the no-private-spaces confirmation is refused
- [ ] Admin records identity, ownership, inspection for a listing: three separate lines appear with dates; clearing removes them; audit log lists each action
- [ ] Visit: tenant requests, owner confirms with a named person, tenant checks in, then out; calendar file downloads; owner sees a woman visitor as Verified tenant
- [ ] Report as unauthorized entry: listing pauses, reporter gets an email at review and at decision, owner can appeal from the dashboard
- [ ] Open /help/directory: each entry shows source and status; verify the numbers marked not yet checked

## Quality
- [ ] 375 px wide: no horizontal scroll on any page, menu opens, filters open as a bottom sheet with the button visible
- [ ] Real phones (one Android, one iPhone): forms, sliders and the sticker area work with a thumb
- [ ] Keyboard only: every form and chip reachable, focus ring visible
- [ ] Reduced motion on: stickers and reveals do not move
- [ ] `/robots.txt`, `/sitemap.xml`, `/api/health` respond
