import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/site/Prose";
import { LOCATION, operator, POLICY_UPDATED, REPO_URL, TO_FILL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  const op = operator();
  const mail = op.email === TO_FILL ? op.email : <a href={`mailto:${op.email}`}>{op.email}</a>;
  return (
    <Page index="Legal" title="Privacy policy" draft missing={op.missing}>
      <p><strong>Last updated:</strong> {POLICY_UPDATED}</p>
      <p>
        Gharmatch is an open-source project. You can read how our code handles your data in our <a href={REPO_URL} target="_blank" rel="noopener noreferrer">public repository</a>, for example <code>src/server/contacts.ts</code> and <code>src/lib/safety.ts</code>. This policy explains what personal data the live Gharmatch service collects, why, and your rights under India’s <strong>Digital Personal Data Protection Act, 2023</strong> (“DPDP Act”). The project maintainer named in section 7 is the Data Fiduciary, and you are the Data Principal.
      </p>

      <h2>1. What we collect, and why</h2>
      <p>We collect only what is needed to run house-rule matching and keep people safe.</p>
      <ul>
        <li><strong>Sign-in details:</strong> your email address, name and profile picture as Google gives them, and a Google account identifier, to sign you in. Sign-in is with Google only. We do not keep Google’s access tokens.</li>
        <li><strong>Phone number:</strong> required to rent out a home, optional for tenants. It is stored privately, left out of ordinary database queries, and shown to another user <strong>only after</strong> an interest between you is accepted.</li>
        <li><strong>Your agreement:</strong> the date and version of the Terms and Privacy Policy you accepted, so we can record your consent and ask again if they change.</li>
        <li><strong>Listings, searches and messages:</strong> your house rules and preferences, photos shrunk to WebP, a private full address, an approximate map pin, interest messages and visit plans.</li>
        <li><strong>Verification dates, no ID files:</strong> when we check an ID, an ownership document or a building, we record <strong>only the type of check and its date</strong>. We never keep copies of your Aadhaar, PAN, passport or property papers.</li>
        <li><strong>Trusted contact (optional):</strong> a name and number you enter to address your own visit-safety message. We never contact or message them.</li>
        <li><strong>Agreed house rules:</strong> when an interest is accepted, a saved copy of the home’s house rules and disclosures at that moment, so both sides can check what was agreed.</li>
        <li><strong>Safety report copies:</strong> when someone files a report, a saved copy of the reported listing, search or account, account ids, and recent messages between the two accounts, so evidence cannot be erased by editing or deleting.</li>
        <li><strong>Anonymous counters:</strong> simple counts such as “interest sent”, with no name, email or phone attached, to see whether the project is useful.</li>
      </ul>

      <h2>2. Who can see your data</h2>
      <ul>
        <li><strong>Public visitors</strong> see listings with house rules, photos and a map showing only an area of about 1 km. They never see your phone, email or exact address.</li>
        <li><strong>Accepted matches only:</strong> your exact address, email and phone open to <strong>one specific person</strong> only after an interest between you is accepted.</li>
        <li><strong>Extra care for women’s searches:</strong> for searches by women or mixed groups, landlords see only the requirements. No name or free-text introduction is shown until the tenant replies.</li>
        <li><strong>Project maintainers (admins)</strong> can see flagged posts and safety reports, only to moderate abuse and support dispute snapshots.</li>
      </ul>

      <h2>3. What we do not do</h2>
      <ul>
        <li><strong>No selling data.</strong> We never sell, rent or share user data with brokers, marketers or lead-generation companies.</li>
        <li><strong>No personal data in logs.</strong> Phone numbers and emails are kept out of our server logs.</li>
        <li><strong>No marketing.</strong> We only send essential service emails, such as reports and appeals you file, or critical account and safety notices, and never promotional spam.</li>
        <li><strong>Today there are no ads and no fees.</strong> If the project ever adds optional paid features to cover server costs, we will give notice and update these documents first, and we will still never sell your personal contact details to third parties.</li>
      </ul>

      <h2>4. Infrastructure and service providers</h2>
      <p>These providers store and process data on our behalf, under security duties:</p>
      <ul>
        <li><strong>Vercel</strong>: hosting, with functions set to Mumbai (bom1).</li>
        <li><strong>Neon</strong>: the PostgreSQL database.</li>
        <li><strong>Cloudflare R2</strong>: photo storage.</li>
        <li><strong>Google</strong>: sign-in and map links or embeds.</li>
        <li><strong>Resend</strong>: report and appeal emails, when switched on.</li>
      </ul>
      <p>Some providers may process or back up data on servers outside India, including in the United States or the European Union, unless the Central Government restricts a destination under Section 16 of the DPDP Act, 2023. Because the project uses free and low-cost tiers, a provider’s limits or outage can make the service slow or unavailable.</p>

      <h2>5. Safety, mediation and law enforcement</h2>
      <p>We may keep and share saved report copies, account ids, messages and timestamps:</p>
      <ol>
        <li>with the police or a court when we receive a valid legal request under Indian law, including Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023 or the Information Technology Act, 2000, or when needed in good faith to prevent serious physical harm, unlawful surveillance, extortion or fraud; and</li>
        <li>with both people in a match during <strong>Step 2, neutral rule-snapshot facilitation</strong>, under our <Link href="/terms">Terms of Use</Link>, so neither can falsely say the house rules were different when they matched.</li>
      </ol>

      <h2>6. Retention, deletion and your rights</h2>
      <ul>
        <li><strong>Listings expire after 30 days</strong> unless you press “Still available” on your dashboard.</li>
        <li><strong>Edit and delete:</strong> you can edit or delete your listings and searches at any time.</li>
        <li><strong>Account deletion and withdrawing consent:</strong> delete your account from the <Link href="/account">account page</Link>. Your name, email, phone, picture and trusted contact are removed at once, and the empty record is removed for good after 30 days. If you are part of an active or past abuse report, its saved copy is kept to prevent repeat abuse and meet legal duties, as the DPDP Act allows. Processing done before you withdraw consent stays lawful.</li>
      </ul>
      <p>Under the DPDP Act, 2023 you have the right to:</p>
      <ol>
        <li>ask for a summary of the personal data we process about you and what we do with it;</li>
        <li>have inaccurate data corrected, completed or erased;</li>
        <li>withdraw your consent;</li>
        <li>nominate another person to exercise your rights if you die or cannot act for yourself; and</li>
        <li>complain to our Grievance Officer first, and then approach the <strong>Data Protection Board of India</strong> if you are not satisfied or hear nothing within the time allowed.</li>
      </ol>

      <p><strong>Security and your duties.</strong> We protect your data with encryption in transit (HTTPS) and strict server-side access controls (see <code>src/server/contacts.ts</code>). Under Section 15 of the DPDP Act, 2023, you must not impersonate anyone, give false information during verification, or file false or frivolous reports or grievances.</p>

      <h2>7. Grievance contact</h2>
      <p>For data requests, bugs or safety grievances, write to:</p>
      <ul>
        <li><strong>Name:</strong> {op.officer}, Project Maintainer and Grievance Officer</li>
        <li><strong>Email:</strong> {mail}</li>
        <li><strong>Location:</strong> {LOCATION}</li>
        <li><strong>Response time:</strong> acknowledged within <strong>24 hours</strong> and resolved within <strong>15 days</strong>.</li>
      </ul>
    </Page>
  );
}
