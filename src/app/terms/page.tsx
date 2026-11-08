import type { Metadata } from "next";
import Link from "next/link";
import { Page } from "@/components/site/Prose";
import { operator, POLICY_UPDATED } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of use and dispute framework" };

export default function Terms() {
  const op = operator();
  return (
    <Page index="Legal" title="Terms of use" draft missing={op.missing}>
      <p><strong>Last updated:</strong> {POLICY_UPDATED}</p>
      <p>
        Welcome to <strong>Gharmatch</strong> ({op.domain}), operated by <strong>{op.name}</strong> (“Gharmatch”, “we”, “us” or “our”). By using, browsing or registering on Gharmatch you (“User”, “Landlord”, “Tenant” or “you”) agree to be bound by these Terms of Use. If you do not agree to every provision, do not use Gharmatch.
      </p>

      <h2>1. Nature of the platform and intermediary status</h2>
      <p><strong>1.1 Discovery and rule matching only.</strong> Gharmatch is a technology platform for finding residential rentals in Ahmedabad and Gandhinagar by comparing the house rules landlords state with the needs tenants state.</p>
      <p><strong>1.2 Not a broker, agent or property manager.</strong> Gharmatch is not a real estate broker, channel partner, property manager, lessor, lessee or legal agent of any User. We do not own, manage, lease, control or guarantee any property listed here, and we do not take part in rent negotiation, deposit collection or signing a lease.</p>
      <p><strong>1.3 Intermediary.</strong> Gharmatch operates as an “intermediary” as defined in Section 2(1)(w) of the Information Technology Act, 2000 (“IT Act”), and claims the protection of Section 79 of that Act read with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021. Listings, house rules, searches, photos and messages are created by Users, not by us.</p>

      <h2>2. Eligibility</h2>
      <p>You must be at least <strong>18 years old</strong> and legally competent to enter into a contract under Section 11 of the Indian Contract Act, 1872, to use Gharmatch.</p>

      <h2>3. House rules, not discrimination</h2>
      <p><strong>3.1 Practical rules are allowed.</strong> Landlords and Tenants may state objective household rules and preferences: food in shared kitchens, pets, smoking and alcohol, visitor timings, lease length, notice periods and the number of people.</p>
      <p><strong>3.2 No discrimination.</strong> You must never state, filter, screen or hint at exclusions based on <strong>religion, caste, sub-caste, community, sect, surname, race, or place or state of origin</strong>, whether directly, by sound-alike spellings, code words or proxies.</p>
      <p><strong>3.3 Enforcement.</strong> We use automated text checks and manual review to find prohibited screening and surname-based filtering. Content that breaks this rule is blocked or removed without notice, and repeat or serious offenders are permanently suspended.</p>

      <h2>4. Privacy, cameras, keys and entry</h2>
      <p>To prevent harassment and invasion of privacy, every User agrees to this safety baseline:</p>
      <p><strong>4.1 No cameras in private spaces.</strong> Surveillance cameras, audio recorders and smart sensors are strictly prohibited inside any bedroom, bathroom, changing area or other private living space.</p>
      <p><strong>4.2 Disclose common-area cameras.</strong> Any camera in an exterior or shared area (entrance gate, parking, corridor) must be disclosed in the listing, with its exact location and who can see live feeds or recordings.</p>
      <p><strong>4.3 Keys and notice.</strong> Landlords must state in the listing who holds duplicate keys and the minimum notice they or their representative give before entering, except in a verifiable emergency such as a fire or a serious water leak.</p>
      <p><strong>4.4 Zero tolerance.</strong> Misrepresenting cameras, or entering a rented home without the stated notice or the tenant’s consent, leads to permanent removal from Gharmatch and preservation of records for law enforcement.</p>

      <h2>5. What our checks are, and are not</h2>
      <p><strong>5.1 Point-in-time indicators.</strong> A listing or profile may show “Identity checked”, “Ownership documents reviewed” or “Physically inspected”, each with a date. They are three separate checks, recorded by an administrator on that date only.</p>
      <p><strong>5.2 What they are not.</strong></p>
      <ul>
        <li><strong>“Identity checked”</strong> means an administrator saw a government-issued photo ID, in person or on video, and matched the name on the stated date. It is not a police verification, a criminal background check or a character certificate.</li>
        <li><strong>“Ownership documents reviewed”</strong> means an administrator saw a property tax receipt, utility bill, property card or an owner’s authorisation letter on the stated date. It is not a legal title search, an encumbrance check, a check of the right to sublet, or a guarantee against property disputes or fraud.</li>
        <li><strong>“Physically inspected”</strong> means a person acting for Gharmatch visited the address on the stated date to confirm the building exists and matches what the listing says. It is not a structural, electrical or fire-safety audit, and not a guarantee that the home is free of hidden defects or unlawful surveillance.</li>
      </ul>
      <p><strong>5.3 Do your own checks.</strong> You alone are responsible for your own due diligence: checking original ownership documents, signing a registered leave-and-licence or rental agreement, and completing police tenant verification as required under local rules.</p>

      <h2>6. Money and scams</h2>
      <p><strong>6.1 No payments on Gharmatch.</strong> Gharmatch is free. We never ask for brokerage, booking fees, visit charges or deposits, and we do not handle rent.</p>
      <p><strong>6.2 Never pay before you visit.</strong> Tenants must never send a token advance, deposit or visit fee by UPI, bank transfer or cash before seeing the home in person and checking the landlord’s original documents. Gharmatch is not liable for fraud or for money sent outside the platform.</p>

      <h2>7. Conduct</h2>
      <p>You agree not to:</p>
      <ul>
        <li>post false, misleading, outdated or bait-and-switch listings or tenant requirements;</li>
        <li>put phone numbers, email addresses, social media handles or external links in public listing text or search introductions to get around the acceptance step;</li>
        <li>harass, stalk, intimidate or message anyone after they decline an interest or withdraw consent; or</li>
        <li>scrape, crawl, reverse-engineer or copy listings or User data from Gharmatch for a commercial brokerage database.</li>
      </ul>

      <h2>8. Mediative framework and dispute resolution</h2>
      <p>Gharmatch tries to prevent friction by lining up house rules at the start. If a misunderstanding, a rule conflict or a dispute arises between a Landlord and a Tenant introduced through Gharmatch, or between a User and Gharmatch, the parties agree to follow this three-step protocol.</p>
      <h3>Tier 1. Cooling-off and rule-snapshot review (days 1 to 7)</h3>
      <p>Before escalating publicly or starting legal proceedings, the person with the complaint will tell the other in writing, or file an in-app report, naming the house rule or expectation they say was broken. Both sides will then observe a <strong>7-day good-faith cooling-off period</strong>, look at the house-rule snapshot saved when the interest was accepted, and try to settle it.</p>
      <h3>Tier 2. Neutral platform facilitation (non-binding)</h3>
      <p><strong>Snapshot.</strong> When a Landlord or Tenant reports a house-rule discrepancy or a conduct issue, Gharmatch may, at its discretion, act as a neutral technical facilitator and give both sides the timestamped record of the house rules and disclosures (keys, notice before entry, common-area cameras) and the first messages saved when the interest was accepted.</p>
      <p><strong>No adjudication.</strong> Gharmatch is not a judge, arbitrator or rent tribunal. Our role is limited to showing objective platform records so that people can calm a misunderstanding. We have no power to enforce a lease, order an eviction or compel a deposit refund.</p>
      <h3>Tier 3. Voluntary pre-litigation mediation (Mediation Act, 2023)</h3>
      <p>If a dispute is not resolved through Tier 1 or Tier 2 within 15 days, the parties agree to first try confidential mediation under the <strong>Mediation Act, 2023</strong>, with an independent mediator or mediation centre agreed between them in Ahmedabad or Gandhinagar, Gujarat, before going to a civil court. Nothing here stops anyone, including Gharmatch, from reporting a crime, a physical threat, voyeurism, extortion or fraud to the police at once.</p>

      <h2>9. Limits of liability</h2>
      <p><strong>9.1 As is.</strong> Gharmatch is provided “as is” and “as available”, without warranties of any kind, express or implied. Match scores are aids built only from what people enter. They do not predict behaviour or compatibility.</p>
      <p><strong>9.2 Release.</strong> To the extent the law allows, you release Gharmatch and its operator from claims, demands, injury, distress, damage to property, theft, financial loss or lease disputes arising from your dealings, visits or tenancy with any other User.</p>
      <p><strong>9.3 Cap.</strong> To the maximum extent permitted by Indian law, Gharmatch and its operator are not liable for any indirect, incidental, consequential or punitive loss, or for any direct loss above <strong>₹100</strong> or the total you paid us in the previous 12 months (which is <strong>₹0</strong>), whichever is lower.</p>

      <h2>10. Indemnity</h2>
      <p>You agree to defend, indemnify and hold harmless Gharmatch and its operator against claims, FIRs, legal notices, liabilities, damages, losses and expenses (including reasonable advocate fees and litigation costs) arising out of or connected with: (a) your breach of these Terms; (b) false information, unlawful surveillance or discriminatory content you post; (c) any tenancy, money or physical dispute between you and another User; or (d) your breach of any law or of anyone’s rights.</p>

      <h2>11. Moderation, suspension and termination</h2>
      <p>We may hold, redact or remove any listing, search or message, and suspend or end any account at any time, with or without notice, if we believe a User broke these Terms, crossed a safety threshold, did not confirm availability, or puts the community at risk.</p>

      <h2>12. Governing law and courts</h2>
      <p>These Terms are governed by the laws of India. Subject to the steps in clause 8, the courts at <strong>Ahmedabad / Gandhinagar, Gujarat</strong> have exclusive jurisdiction over disputes arising out of or relating to Gharmatch.</p>

      <h2 id="grievance">13. Grievance Officer (IT Rules, 2021)</h2>
      <p>As required by the Information Technology Act, 2000 and the rules made under it, the Grievance Officer is:</p>
      <ul>
        <li><strong>Name:</strong> {op.officer}</li>
        <li><strong>Designation:</strong> Grievance Officer, Gharmatch</li>
        <li><strong>Address:</strong> {op.address}</li>
        <li><strong>Email:</strong> {op.email === "[to be filled before launch]" ? op.email : <a href={`mailto:${op.email}`}>{op.email}</a>}</li>
        <li><strong>Response time:</strong> we acknowledge complaints within <strong>24 hours</strong> and resolve them within <strong>15 days</strong> of receipt, or within <strong>72 hours</strong> for complaints about impersonation, privacy violations or unlawful surveillance.</li>
      </ul>
      <p>See also our <Link href="/privacy">Privacy Policy</Link>. In an emergency call 112 first; we cannot send help.</p>
    </Page>
  );
}
