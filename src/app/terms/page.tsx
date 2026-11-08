import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/site/Prose";
import { LOCATION, operator, POLICY_UPDATED, TO_FILL } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of use and community mediation framework" };

export default function Terms() {
  const op = operator();
  return (
    <Page index="Legal" title="Terms of use" draft={op.missing.length > 0} missing={op.missing}>
      <p><strong>Last updated:</strong> {POLICY_UPDATED}</p>
      <p>
        <strong>Gharmatch</strong> is an open-source, community-driven project built to make finding and letting homes in Ahmedabad and Gandhinagar fairer and more transparent, by matching on house rules.
      </p>
      <p>
        By creating an account, posting a listing or search, or using Gharmatch, you agree to these Terms of Use (“Terms”) with the project maintainer(s) (“Gharmatch”, “we” or “us”).
      </p>

      <h2>1. Community project and intermediary status</h2>
      <p><strong>1.1 Free, community operation.</strong> Gharmatch currently runs as a free, non-commercial, open-source community initiative on limited cloud infrastructure. The core matching service is free today. We reserve the right to introduce optional paid features, sustainability tiers, verification services or platform fees in the future to cover server and running costs. If we do, we will give clear advance notice and publish updated terms before they apply to you.</p>
      <p><strong>1.2 Community infrastructure and best-effort availability.</strong> Because Gharmatch runs on free and low-cost hosting with usage limits, the site may be slow, rate-limited, unavailable or show errors, especially when many people visit at once. We make no promise that the service, a message, an invite, a notification or a listing will always be available or delivered. We are not liable for loss or delay caused by outages, quota limits, maintenance or a failure of a hosting or email provider.</p>
      <p><strong>1.3 Not a broker or agent.</strong> Gharmatch is a technical matching tool. We are not a broker, property manager, lessor, lessee or agent for any User. We never take part in rent negotiations, deposits or lease agreements.</p>
      <p><strong>1.4 Intermediary (Section 79, IT Act).</strong> Gharmatch operates as an “intermediary” under Section 2(1)(w) and Section 79 of the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. Listings, house rules, photos and messages are created by Users, not by us.</p>
      <p><strong>1.5 Eligibility.</strong> You must be at least <strong>18 years old</strong> and legally able to enter into a contract under the Indian Contract Act, 1872.</p>

      <h2>2. House rules, not who you are</h2>
      <p><strong>2.1 Practical rules are allowed.</strong> You may state practical household expectations: kitchen and food rules, pets, smoking, alcohol, visitor timings, lease length, notice period and the number of people.</p>
      <p><strong>2.2 No prohibited screening.</strong> You must never filter, exclude or hint at preferences based on <strong>religion, caste, community, surname or place of origin</strong>, directly or through code words. Automated text checks and human moderators will block or remove content that breaks this rule, and repeat offenders are suspended.</p>

      <h2>3. Cameras, keys and privacy</h2>
      <ul>
        <li><strong>No cameras in private spaces.</strong> Cameras, microphones and recording sensors are strictly forbidden inside bedrooms, bathrooms or any private living space.</li>
        <li><strong>Disclose common-area cameras.</strong> Any camera at an entrance, in parking or in a shared corridor must be disclosed in the listing, with where it is and who can view the footage.</li>
        <li><strong>Keys and entry notice.</strong> Landlords must state who keeps duplicate keys and how much notice they will give before entering the flat, except in a genuine emergency. Breaking these rules leads to permanent removal.</li>
      </ul>

      <h2>4. What verification indicators mean</h2>
      <p>A listing may show “Identity checked”, “Ownership documents reviewed” or “Physically inspected”, each with a date. They are three separate checks.</p>
      <ul>
        <li><strong>Identity checked:</strong> a project maintainer saw a government photo ID, in person or on video, and matched the name on that date.</li>
        <li><strong>Ownership documents reviewed:</strong> a project maintainer saw a property tax receipt, utility bill, property card or an owner’s authorisation letter on that date.</li>
        <li><strong>Physically inspected:</strong> someone acting for the project visited the address on that date to confirm the building exists and matches the listing.</li>
      </ul>
      <p><strong>Not a guarantee.</strong> These are point-in-time records only. They are not a legal title check, a criminal background check, a police verification, a structural, electrical or fire-safety audit, or any guarantee against fraud or hidden defects.</p>
      <p><strong>Your own due diligence.</strong> You are responsible for checking original ownership papers, signing a proper rental agreement, and completing local police tenant verification yourself.</p>

      <h2>5. Money and personal safety</h2>
      <ul>
        <li><strong>Never pay before visiting.</strong> Do not send token advances, booking fees or deposits by UPI or bank transfer before you have seen the home in person and checked the owner. Gharmatch never asks for money in chats or messages.</li>
        <li><strong>No contact details in public text.</strong> Do not put phone numbers, emails or social handles in public listing text or search introductions. Contact details open only after a match is accepted.</li>
        <li><strong>No harassment or scraping.</strong> Do not pressure, stalk or harass anyone, including after they decline or withdraw, and do not scrape or copy listings or User data into a brokerage database.</li>
        <li><strong>No false listings.</strong> Do not post false, misleading, outdated or bait-and-switch listings or requirements.</li>
      </ul>

      <h2>6. Mediative dispute resolution framework</h2>
      <p>Gharmatch exists to prevent landlord-tenant conflict by lining up expectations at the start. If a misunderstanding or rule dispute arises between a Landlord and a Tenant matched on Gharmatch, or between a User and the project, everyone agrees to follow this three-step process.</p>
      <h3>Step 1. 7-day cooling-off and rule check</h3>
      <p>Before escalating publicly or legally, notify the other person, or file an in-app report, pointing to the exact house rule in question. Both sides agree to a <strong>7-day good-faith cooling-off period</strong> to talk it through against the rules that were agreed when the match was accepted.</p>
      <h3>Step 2. Neutral rule-snapshot facilitation</h3>
      <p>If a report is filed, the maintainers may act as a <strong>neutral technical facilitator</strong> by sharing the timestamped copy of the house rules, camera and key disclosures, and first messages as they stood when the match was accepted. Both people can also see this saved copy on their dashboard.</p>
      <p>We are not a judge, arbitrator or rent court. We cannot make anyone sign a lease, leave a flat or return a deposit. We only provide the objective record so both sides can settle it fairly.</p>
      <h3>Step 3. Voluntary mediation and local courts</h3>
      <p>If a dispute is still unresolved after 15 days, the parties agree to first try amicable mediation under the <strong>Mediation Act, 2023</strong> in Ahmedabad or Gandhinagar. These Terms are governed by the laws of India, and the courts at <strong>Ahmedabad / Gandhinagar, Gujarat</strong> have exclusive jurisdiction. Nothing here stops anyone from reporting a crime, fraud or a physical threat to the police at once.</p>

      <h2>7. As-is service, liability limit and indemnity</h2>
      <p><strong>7.1 As is.</strong> Gharmatch and its match scores are provided “as is” and “as available”, without warranties of any kind. Match scores are aids built from what people enter. They do not predict behaviour or compatibility.</p>
      <p><strong>7.2 Your own risk.</strong> You use Gharmatch and visit homes at your own risk. To the fullest extent the law allows, you release the project maintainers and contributors from claims, financial loss, property damage or personal injury arising from your dealings with other Users.</p>
      <p><strong>7.3 Liability limit.</strong> Because Gharmatch is provided free of charge, to the fullest extent permitted by Indian law, the total liability of Gharmatch, its maintainers and open-source contributors for any claim whatsoever is <strong>₹0 (zero rupees)</strong>, or, if applicable law requires a nominal floor, a maximum aggregate of <strong>₹100 (one hundred rupees)</strong>.</p>
      <p><strong>7.4 Indemnity.</strong> If your breach of these Terms, a false listing, an unlawful camera, or a dispute with another User causes legal claims, police notices or expenses against Gharmatch or its maintainers, you agree to cover the resulting legal costs, including reasonable advocate fees.</p>

      <h2>8. Moderation and updates</h2>
      <p>We may hold, edit or remove content, and suspend or end accounts, to keep the platform safe and lawful, including after a report. We may update these Terms as the project changes, including if it grows beyond free hosting, and will show the date of the latest revision at the top. When the Terms change in a way that matters, we will ask you to agree again before you continue.</p>

      <h2 id="grievance">9. Grievance Officer</h2>
      <p>As required by the IT Rules, 2021:</p>
      <ul>
        <li><strong>Grievance contact:</strong> {op.officer}, Project Maintainer</li>
        <li><strong>Email:</strong> {op.email === TO_FILL ? op.email : <a href={`mailto:${op.email}`}>{op.email}</a>}</li>
        <li><strong>Location:</strong> {LOCATION}</li>
        <li><strong>Timeline:</strong> we acknowledge reports within <strong>24 hours</strong> and aim to resolve them within <strong>15 days</strong>, or within <strong>72 hours</strong> for urgent privacy or impersonation reports.</li>
      </ul>
      <p>See also our <Link href="/privacy">Privacy Policy</Link>. In an emergency call 112 first. We cannot send help.</p>
    </Page>
  );
}
