import type { Metadata } from "next";
import { Page } from "@/components/site/Prose";

export const metadata: Metadata = { title: "House rules, not who you are" };

export default function Policy() {
  return (
    <Page index="Policy" title="House rules, not who you are.">
      <p>Landlords may set practical rules for their home. They may not screen people by identity.</p>

      <h2>Allowed</h2>
      <ul>
        <li>Food in the kitchen: vegetarian only, egg, non-veg allowed, no restriction.</li>
        <li>Household type: family, bachelors, working women, students, sharing. Women-only and men-only homes.</li>
        <li>Pets, smoking, alcohol, visitors, quiet hours, lease length, deposit, notice, parking, work from home, number of people.</li>
        <li>Security features, so people can choose a home they feel safe in.</li>
      </ul>

      <h2>Not allowed</h2>
      <ul>
        <li>Religion, caste, community, surname, or where someone is from, stated or hinted.</li>
        <li>Free text that does the same thing in other words.</li>
      </ul>

      <h2>How we enforce it</h2>
      <p>There are no fields for any of the above. Every title, description, intro and message is checked on our server, in English, Hindi and Gujarati. Clear violations are rejected with a message. Unclear wording is held for a person to review. You can report a listing for discrimination from its page.</p>
    </Page>
  );
}
