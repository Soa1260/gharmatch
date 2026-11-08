# Design rules

Reference: the Gianji store (near-black ground, one soft light source, pill controls, thin-bordered
dark cards, light and tightly spaced display type). Components follow the Skiper UI and Motion
examples style but are written in this repo, so nothing is copied from paid components.

## Look
- Dark only for launch. Ground `#060709`, surfaces `#0d0f12` and `#14171b`, hairline borders `#20242a`.
- One accent, lamplight `#f0b56e`, defined once as `--color-lamp` in `src/app/globals.css`. Change that
  value to re-colour the site. Use it for emphasis words, active progress and one highlight per screen.
- Artwork is generated, not stock: `CoverArt` (listing covers, seeded by slug so a home always looks
  the same). Soft light on a dark ground, no people, no 3D renders. `Horizon` exists but is no longer used on the landing page.
- Type: Bricolage Grotesque 600 for display (tight, left-aligned, big), Manrope for body, DM Mono for numbers, rent, scores and small index labels like (01).
- Shape: pills for controls, 24 to 32 px radius for cards and panels, hairlines instead of shadows.

## Personality
- Stickers: house rules as tilted, draggable tags in lamp, lime, blush and paper. They are the hero, because rules are the product.
- Voice: plain English with light Hinglish and Gujarati touches ("Non-veg chalega?", "Broker nahi, bas rules", the word ઘર). Never forced into legal or safety text.
- Flat colour blocks (the amber closing panel) instead of glows. No orb, no centred hero, no floating glass nav.
- Sections are labelled with mono indexes, not coloured eyebrow text.

## Do not
- No gradient blobs, glass cards stacked on glass cards, emoji, sparkle icons or three-icon feature rows.
- No marketing filler ("seamless", "unlock", "revolutionize", "AI-powered"). Matching is a rule-based score.
- No invented statistics, testimonials or listings. Development samples are labelled "Sample" and never render in production.
- No more than one lamp-coloured element competing per viewport.

## Accessibility
- Visible focus ring on every control, keyboard operable chips, `aria-live` on the match demo.
- Text contrast at least 4.5:1 on its surface. `--color-faint` is for captions only.
- All motion respects `prefers-reduced-motion` (see MOTION.md).

## Review gate
Before a page is called done: desktop and 375 px screenshots checked against this list.
