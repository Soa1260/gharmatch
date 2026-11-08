import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/site/Prose";
import { operator, POLICY_UPDATED, TO_FILL } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy policy" };

const COLLECTED: Array<{ what: string; details: React.ReactNode; why: string }> = [
  { what: "Sign-in data", details: "Your Google email address, name and profile picture, as Google gives them, and a Google account identifier. We do not keep Google’s access tokens.", why: "To sign you in and tell one account from another. Sign-in is with Google only." },
  { what: "Mobile number", details: "Required to rent out a home. Optional for tenants. Stored privately.", why: "So that a person we can reach stands behind each listing. Shown to one other person only after an interest between you is accepted." },
  { what: "Your agreement", details: "The date and version of the Terms and Privacy Policy you accepted.", why: "To record your consent, and to ask again if the documents change." },
  { what: "Listings and searches", details: "House rules, preferences, photos (shrunk to WebP), a map pin, a private full address, interest messages, visit plans.", why: "To calculate fit, show listings without private details, and introduce people." },
  { what: "Check records", details: <>The type and date of admin checks: identity checked, ownership documents reviewed, physically inspected. <strong>We do not keep copies of your Aadhaar, PAN, passport or property papers.</strong></>, why: "To show those indicators on listings." },
  { what: "Trusted contact", details: "A name and number you choose to enter, optional.", why: "Only to fill in your own visit message. We never message, call or market to them." },
  { what: "Reports and saved copies", details: "When a report is filed: a saved copy of the reported listing, search or account, account ids, and recent messages between the people involved.", why: "To investigate abuse, stop evidence being erased by editing or deleting, help neutral dispute facilitation, and meet legal requests." },
  { what: "Agreed house rules", details: "When an interest is accepted, a saved copy of the home’s house rules and disclosures at that moment.", why: "So both sides can check what was agreed if there is a misunderstanding later." },
  { what: "Usage counts", details: "Totals such as “interest sent”, with no name, email or account attached.", why: "To learn whether the product works, without tracking anyone." },
];

export default function Privacy() {
  const op = operator();
  const mail = op.email === TO_FILL ? op.email : <a href={`mailto:${op.email}`}>{op.email}</a>;
  return (
    <Page index="Legal" title="Privacy policy" draft missing={op.missing}>
      <p><strong>Last updated:</strong> {POLICY_UPDATED}</p>
      <p>
        This policy explains how <strong>Gharmatch</strong> (“we”, “us” or “our”), operated by <strong>{op.name}</strong> as a <strong>Data Fiduciary</strong> under the Digital Personal Data Protection Act, 2023 (“DPDP Act”), collects, uses, shares and protects the personal data of people (“Data Principals”, or “you”) who use Gharmatch.
      </p>

      <h2>1. What we collect, and why</h2>
      <p>We collect only what is needed to match landlords and tenants on house rules and to keep people safe.</p>
      <div className="space-y-px max-sm:space-y-0">
        {COLLECTED.map((row) => (
          <div key={row.what} className="grid gap-1 border-t border-line py-4 sm:grid-cols-[10rem_1fr_1fr] sm:gap-6">
            <p className="font-semibold text-text">{row.what}</p>
            <p><span className="mr-2 font-mono text-[11px] uppercase text-faint sm:hidden">What</span>{row.details}</p>
            <p><span className="mr-2 font-mono text-[11px] uppercase text-faint sm:hidden">Why</span>{row.why}</p>
          </div>
        ))}
        <p className="hidden border-t border-line pt-2 font-mono text-[11px] uppercase text-faint sm:block">
          Columns: what, the details we keep, why we keep them
        </p>
      </div>

      <h2>2. Who can see it</h2>
      <ul>
        <li><strong>Public:</strong> listings without your phone, email or exact address. Maps show only an approximate area of about 1 km.</li>
        <li><strong>After acceptance:</strong> your exact address, email and phone are shown to one specific person only, once an interest between you is accepted.</li>
        <li><strong>Women and mixed-group searches:</strong> landlords see no name or free-text introduction until the tenant replies or accepts.</li>
        <li><strong>Administrators:</strong> named administrators can see reports and flagged content, only to enforce safety rules and handle grievances.</li>
      </ul>

      <h2>3. What we never do</h2>
      <ul>
        <li>We never sell, rent or trade your personal data, and we show no advertising.</li>
        <li>We keep phone numbers and email addresses out of our server logs.</li>
        <li>We send no marketing. Our only emails are about reports and appeals you file, so people who report can learn the outcome.</li>
      </ul>

      <h2>4. Service providers and data held outside India</h2>
      <p>We use these providers (“Data Processors”) to run Gharmatch, and they process data only for us and under security duties:</p>
      <ul>
        <li><strong>Vercel</strong>: hosting and delivery, with functions set to Mumbai (bom1).</li>
        <li><strong>Neon</strong>: the PostgreSQL database.</li>
        <li><strong>Cloudflare R2</strong>: storage for listing photos.</li>
        <li><strong>Google</strong>: sign-in and map links or embeds.</li>
        <li><strong>Resend</strong>: sending report and appeal emails, when switched on.</li>
      </ul>
      <p>We choose Indian regions where we can, but some processors may process or back up data on servers outside India, including in the United States or the European Union, unless the Central Government restricts a destination under Section 16 of the DPDP Act, 2023.</p>

      <h2>5. Law enforcement, safety and disputes</h2>
      <p>We may keep and disclose saved report copies, account ids, timestamps and messages:</p>
      <ol>
        <li>when a court or an authorised law enforcement agency makes a valid written request or order, including under Section 94 of the Bharatiya Nagarik Suraksha Sanhita, 2023, or under the Information Technology Act, 2000;</li>
        <li>when we believe in good faith it is needed to prevent imminent physical harm, unlawful surveillance, extortion or fraud; or</li>
        <li>to give both people in a match the saved house rules and disclosures during neutral facilitation under our <Link href="/terms">Terms of Use</Link>.</li>
      </ol>

      <h2>6. How long we keep data, and deleting it</h2>
      <ul>
        <li><strong>Listings</strong> expire after 30 days unless you confirm from your dashboard that they are still available.</li>
        <li><strong>Deleting your account</strong> from the <Link href="/account">account page</Link> removes your name, email address, phone, picture and trusted contact at once. The empty record is removed for good after 30 days.</li>
        <li><strong>Reports</strong> that involve your account or listing keep their saved copy as long as needed to prevent abuse, defend legal claims and meet legal duties, as the DPDP Act allows.</li>
      </ul>

      <h2>7. Your rights under the DPDP Act, 2023</h2>
      <ol>
        <li><strong>Access.</strong> Ask for a summary of the personal data we process about you and what we do with it.</li>
        <li><strong>Correction, completion and erasure.</strong> Edit or delete your listings, searches and profile from your dashboard, or ask us to correct or erase data.</li>
        <li><strong>Withdraw consent.</strong> Withdraw consent at any time by deleting your account or writing to the Grievance Officer. Processing done before you withdraw stays lawful.</li>
        <li><strong>Nominate.</strong> Nominate another person to exercise your rights if you die or cannot act for yourself.</li>
        <li><strong>Grievance redressal.</strong> Complain to our Grievance Officer first. If you are not satisfied, or hear nothing in the time allowed, you may approach the <strong>Data Protection Board of India</strong>.</li>
      </ol>

      <h2>8. Grievance Officer and privacy contact</h2>
      <p>For privacy questions, access or erasure requests, consent withdrawal, nominations or safety grievances:</p>
      <ul>
        <li><strong>Grievance Officer:</strong> {op.officer}</li>
        <li><strong>Email:</strong> {mail}</li>
        <li><strong>Address:</strong> {op.address}</li>
        <li><strong>Response time:</strong> we acknowledge requests within <strong>24 hours</strong> and resolve them within <strong>15 days</strong>, or sooner where the law requires.</li>
      </ul>
    </Page>
  );
}
