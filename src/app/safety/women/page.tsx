import type { Metadata } from "next";
import Link from "next/link";
import { EmergencyStrip } from "@/components/site/EmergencyStrip";
import { Page } from "@/components/site/Prose";
import { SAFETY_TIPS_WOMEN } from "@/lib/safety";

export const metadata: Metadata = {
  title: "Safety for women",
  description: "How Gharmatch protects women renters, and how to view a home safely.",
};

export default function WomenSafety() {
  return (
    <Page index="Safety" title="For women renters.">
      <p>Women carry more risk when looking for a home, so some protections apply only to women and mixed groups. Here is exactly what they are.</p>

      <h2>What we do for you</h2>
      <ul>
        <li><strong>You are hidden.</strong> Landlords see you as “Verified tenant”. No name, no free-text intro, no exact budget, until you reply to them.</li>
        <li><strong>Landlords must earn the right to write to you.</strong> To invite a woman or a mixed group they need a verified email, a live listing and a phone number on file. They are limited to three invitations a day.</li>
        <li><strong>One upheld safety report ends it.</strong> A landlord whose account or listing has a confirmed safety report can no longer invite women or mixed groups.</li>
        <li><strong>Women-only homes are accountable.</strong> To post one, a landlord must have a phone number on file with us. It stays hidden from tenants.</li>
        <li><strong>Women-only is a hard rule.</strong> Those homes never match anyone else, and nobody can click past it.</li>
        <li><strong>You choose who can invite you.</strong> Turn invitations off in your search. You can still contact landlords, but they cannot start a conversation with you.</li>
        <li><strong>Safety reports act first.</strong> “I need help now”, harassment and unsafe property pause the listing immediately and go to the top of the queue.</li>
        <li><strong>No money talk.</strong> Messages that ask for advance, token or UPI details are refused.</li>
      </ul>

      <h2>Your own tools</h2>
      <ul>
        <li><strong>Trusted contact.</strong> Save one person on your <Link href="/account">account page</Link>. Every listing then has a “Share my visit” button that opens a message to them with the home, the area and a request to call you if they do not hear from you.</li>
        <li><strong>Emergency numbers</strong> on every listing page and on your dashboard once someone accepts.</li>
        <li><strong>Block</strong> anyone from your dashboard. It ends the conversation and hides your details.</li>
      </ul>

      <h2>Before you visit</h2>
      <ul>
        {SAFETY_TIPS_WOMEN.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <ul>
        <li>Ask to meet at the society gate or a nearby shop first, then go up with the guard or a neighbour aware.</li>
        <li>Check the listing page: gated society, guard, CCTV, well-lit entry, female caretaker, video door phone. Fewer ticks means ask more questions.</li>
        <li>Never agree to leave your ID or pay money before a proper visit and an agreement.</li>
      </ul>

      <h2>If something happens</h2>
      <EmergencyStrip compact />
      <p>
        See <Link href="/help">Need help now</Link> for what to do, and how to report so we can act within hours.
      </p>
    </Page>
  );
}
