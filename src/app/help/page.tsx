import type { Metadata } from "next";
import Link from "next/link";
import { EmergencyStrip } from "@/components/site/EmergencyStrip";
import { Page } from "@/components/site/Prose";

export const metadata: Metadata = {
  title: "Need help now",
  description: "What to do right away if you feel unsafe or something went wrong with a rental.",
};

export default function Help() {
  return (
    <Page index="Help" title="Need help now?">
      <p className="text-lg text-text">
        If you are in danger, call <a href="tel:112">112</a> first. Everything else can wait.
      </p>
      <EmergencyStrip />

      <p>Full list with sources and check dates: <Link href="/help/directory">support directory</Link>.</p>

      <h2>If you feel unsafe right now</h2>
      <ul>
        <li>Leave. You do not owe anyone an explanation, a viewing or a polite goodbye.</li>
        <li>Go to a place with people: a shop, a petrol pump, a neighbour, the society gate.</li>
        <li>Call 112, or a person you trust, and share your live location.</li>
        <li>If you are inside and cannot leave, call or message a person you trust and keep the phone on.</li>
      </ul>

      <h2>After you are safe</h2>
      <ul>
        <li>Open the listing or search on Gharmatch, choose Report, and pick “I need help now”. It pauses the listing at once and goes to the top of our review queue.</li>
        <li>Block the person from your dashboard. They can no longer see your details.</li>
        <li>Screenshot messages, and note the time, address and what was said. Keep them.</li>
        <li>Make a police complaint, or ask the women helpline to help you do it. For a crime, we can give police the record we hold when they send a valid legal request.</li>
      </ul>

      <h2>If you paid money</h2>
      <ul>
        <li>Call 1930 or use the national cyber crime portal straight away. Reporting within the first hours gives the best chance of stopping the transfer.</li>
        <li>Tell your bank. Keep the payment receipt and the chat.</li>
        <li>Report the listing here as “Scam or fake listing”, so nobody else loses money.</li>
      </ul>

      <h2>What we can and cannot do</h2>
      <p>
        We can pause listings, suspend accounts, keep a frozen copy of what was reported, and help police with a legal request. We cannot send someone to you, and we cannot check every home in person. Read the{" "}
        <Link href="/safety">safety guide</Link> before you visit, and the <Link href="/safety/women">guide for women</Link>.
      </p>
    </Page>
  );
}
