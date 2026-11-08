import type { Metadata } from "next";
import { Page } from "@/components/site/Prose";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  const email = process.env.NEXT_PUBLIC_GRIEVANCE_EMAIL ?? "grievance@example.com";
  return (
    <Page index="Legal" title="Privacy policy" draft>
      <p>Last updated: replace with the launch date. This describes what Gharmatch collects and why, in plain language.</p>

      <h2>What we collect</h2>
      <ul>
        <li>Your email address, and your name if Google provides it. Used to sign you in.</li>
        <li>A mobile number, only if you add one. It is optional and stored privately.</li>
        <li>What you post: listings (including a private full address and a map pin), searches, interest messages, visit plans and reports.</li>
        <li>Records of admin checks about you or your listing (identity checked, documents reviewed, inspection dates). We record the type and date. We do not keep copies of ID or ownership documents.</li>
        <li>An optional trusted contact (a name and number you choose), used only to address your own visit message. We never contact them.</li>
        <li>When you report something, a saved copy of the reported listing, search or account and your recent messages with it, so a report cannot be erased by editing or deleting.</li>
        <li>Counts of events such as “interest sent”, with no name or contact attached, to learn whether the product works.</li>
      </ul>

      <h2>Who can see it</h2>
      <ul>
        <li>The public sees listings without your phone, email or exact address. A map shows only an approximate area of about 1 km.</li>
        <li>The exact address is shown to the other person only after an interest is accepted.</li>
        <li>Your phone and email are shown to one other person only when an interest between you is accepted.</li>
        <li>For women and mixed-group searches, landlords see no name or free-text intro until the tenant replies.</li>
        <li>Admins can see reports and flagged content to keep people safe.</li>
      </ul>

      <h2>Safety and the law</h2>
      <p>We may keep and share saved report copies, account ids, messages and timestamps with the police or a court when we receive a valid legal request, or when we believe it is needed to prevent serious harm. Deleting your account removes your name, phone and email, but reports that involve you keep their saved copy for these reasons.</p>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell personal data or show advertising.</li>
        <li>We do not log phone numbers or emails in our server logs.</li>
      </ul>

      <h2>Service providers</h2>
      <p>We use hosting (Vercel), a database (Neon), image storage (Cloudflare) and email delivery (Resend). They process data on our behalf to run the service.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Edit or delete your listings and searches at any time from your dashboard.</li>
        <li>Delete your account from the <a href="/account">account page</a>. Personal data is removed immediately, and the empty record is purged after 30 days.</li>
        <li>For access or correction requests, write to <a href={`mailto:${email}`}>{email}</a>.</li>
      </ul>

      <h2>Retention</h2>
      <p>Listings expire after 30 days unless you confirm they are still available. Reports are kept while needed to prevent abuse.</p>

      <h2>Grievances</h2>
      <p>Contact <a href={`mailto:${email}`}>{email}</a>. Add the responsible person’s name and the response time before launch.</p>
    </Page>
  );
}
