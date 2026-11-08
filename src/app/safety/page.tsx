import type { Metadata } from "next";
import Link from "next/link";
import { EmergencyStrip } from "@/components/site/EmergencyStrip";
import { Page } from "@/components/site/Prose";
import { SAFETY_TIPS_ALL, SAFETY_TIPS_WOMEN } from "@/lib/safety";

export const metadata: Metadata = { title: "Safety guide", description: "How to view and rent a home safely, and what Gharmatch does to protect you." };

export default function Safety() {
  return (
    <Page index="Safety" title="Rent safely.">
      <p>A good listing site cannot make a stranger trustworthy. Here is what we do, and what you should do.</p>
      <EmergencyStrip />
      <p>Women renters: read <Link href="/safety/women">the guide for women</Link>. In trouble now: <Link href="/help">need help now</Link>.</p>

      <h2>For everyone</h2>
      <ul>{SAFETY_TIPS_ALL.map((t) => <li key={t}>{t}</li>)}</ul>

      <h2>If you are a woman, or going alone</h2>
      <ul>{SAFETY_TIPS_WOMEN.map((t) => <li key={t}>{t}</li>)}</ul>

      <h2>What Gharmatch does</h2>
      <ul>
        <li>Phone numbers and emails stay hidden until the other side accepts.</li>
        <li>Women and mixed-group searches show landlords no name or intro until they reply.</li>
        <li>Landlords need a verified email, a live listing and a phone number on file to invite women or mixed groups, and are capped at three invitations a day.</li>
        <li>Safety reports (need help, harassment, unsafe property) pause the listing or search at once. Any report from two different people does the same.</li>
        <li>A frozen copy of what was reported is kept, so editing or deleting a listing cannot erase the evidence.</li>
        <li>Messages that ask for advance, token or UPI details are refused, and listings that read like known scams are held for review.</li>
        <li>Every listing and search has a report button. Harassment and unsafe-property reports are reviewed first.</li>
        <li>You can block anyone. Blocking ends pending conversations and hides contact details both ways.</li>
      </ul>

      <h2>Red flags</h2>
      <ul>
        <li>Asked to pay a “token” or “booking” amount before visiting.</li>
        <li>Photos that do not match the address, or an owner who will not meet.</li>
        <li>Pressure to move conversation off the platform straight away.</li>
      </ul>
      <p>If you feel unsafe, leave and call 112. Then report the listing so we can act.</p>
    </Page>
  );
}
