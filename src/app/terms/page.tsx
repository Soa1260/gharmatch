import type { Metadata } from "next";
import { Page } from "@/components/site/Prose";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <Page index="Legal" title="Terms of use" draft>
      <p>By using Gharmatch you agree to these terms. Gharmatch is an introduction service. It is not a broker, agent or party to any rental agreement.</p>

      <h2>House rules, not who you are</h2>
      <p>Listings and searches may state practical rules such as food, pets, smoking, visitors, lease length and who will live in the home. You must not use religion, caste, community, surname or place of origin as a condition, directly or by hints. Content that does is removed and accounts can be suspended.</p>

      <h2>Cameras and access</h2>
      <p>Cameras are never allowed in bedrooms, bathrooms or any private space. Cameras in common areas must be disclosed, with where they are and who can see recordings. Landlords must state who keeps duplicate keys and when the owner may enter, and must give the notice they state. Breaking these rules can lead to removal.</p>

      <h2>What the checks mean</h2>
      <p>“Identity checked”, “ownership documents reviewed” and “physically inspected” are three separate checks, each recorded with a date. None of them is a guarantee, a legal title check, or a statement that a home is safe.</p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Give true information and keep listings up to date. Confirm availability when asked.</li>
        <li>Do not ask for or send money through Gharmatch. Do not pay a deposit or advance before you have seen the home in person.</li>
        <li>Do not post contact details in public text, and do not harass, pressure or threaten anyone.</li>
        <li>Check ownership, documents and the rental agreement yourself.</li>
      </ul>

      <h2>What we can do</h2>
      <p>We may hold, edit or remove content, and suspend accounts, to keep the service safe or lawful, including after a report.</p>

      <h2>No guarantees</h2>
      <p>Match scores are an aid based on the rules people enter. We do not verify listings, owners or tenants beyond email confirmation, and we are not responsible for what happens between users. Visit safely.</p>

      <h2>Changes and contact</h2>
      <p>We may update these terms and will show the date of the latest version. Add governing law, jurisdiction and the company or individual operating the service before launch.</p>
    </Page>
  );
}
