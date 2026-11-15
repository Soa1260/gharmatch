import type { Post } from "@/lib/blog";

/**
 * Add a post by adding an object to this list and pushing. Keep it quick to read: a one-sentence summary, three to five
 * key points, short paragraphs. Use **double stars** around a few words to make them bold. src/blog.test.ts checks the rules.
 */
export const posts: Post[] = [
  {
    slug: "maintenance-break-14-november",
    title: "Maintenance break on 14 November: what we changed",
    date: "2026-11-14",
    tag: "Update",
    summary: "We took the site offline for a few minutes, twice, to add tools for landlords and update our privacy policy. You will be asked to agree once more.",
    keyPoints: [
      "Landlords now see an “about this account” card and can ask up to 3 questions first.",
      "Landlords can limit who writes to them, and block anyone from a request.",
      "Landlords get safety tips and a “share plan” button for showing a home.",
      "Also: every home shows who posted it, and gharmatch.space is our address.",
      "The privacy policy changed. You will be asked to agree once at your next sign-in.",
    ],
    sections: [
      {
        id: "why-offline",
        heading: "Why the site went offline",
        body: [
          { type: "p", text: "On 14 November you may have seen a **“Back soon”** page. We switched it on twice, for a few minutes each time, while we changed how the database is laid out." },
          { type: "p", text: "Doing it this way means nobody lands on a half-working page in the middle of a change. Everything was back as soon as the checks passed." },
        ],
      },
      {
        id: "landlord-tools",
        heading: "Tools for landlords",
        body: [
          { type: "p", text: "Landlords told us they want to know a little about who is writing to them before they reply. So each request now comes with a short **“about this account”** card." },
          { type: "list", items: [
            "When the account was made",
            "Whether our team has checked their ID",
            "How many safety reports a reviewer upheld",
          ] },
          { type: "callout", text: "The card shows facts about the account, not a judgement of the person. Most good tenants are new here." },
          { type: "p", text: "It never shows a name, phone or email. Searches by women and mixed groups still appear as “Verified tenant”." },
        ],
      },
      {
        id: "questions-and-limits",
        heading: "Questions, limits and blocking",
        body: [
          { type: "p", text: "A landlord can add **up to 3 short questions** to a home. Tenants answer them when they send interest, and the landlord reads the answers with the request." },
          { type: "p", text: "A home can also choose who may write to it:" },
          { type: "list", items: [
            "Anyone with an account",
            "Accounts at least a week old",
            "Only people whose ID we have checked",
          ] },
          { type: "p", text: "To keep inboxes calm, a home pauses new requests while 25 are waiting. A tenant can have 10 waiting at once. Any landlord can **block** a person right from their request." },
        ],
      },
      {
        id: "showing-a-home",
        heading: "Safer home showings",
        body: [
          { type: "p", text: "Meeting a stranger to show your home deserves care too. Landlords now get a short set of safety tips on their dashboard." },
          { type: "p", text: "There is also a **“share plan”** button on each visit. It opens a message to the person you trust, with the area and time, and you press send." },
        ],
      },
      {
        id: "no-brokers",
        heading: "Also new: no brokers, no fees",
        body: [
          { type: "p", text: "Every home now says who posted it: the owner, a family member, a caretaker or an authorised agent. The poster confirms they may let the home and will take **no fee** from tenants." },
          { type: "p", text: "One account can have at most 5 homes. If anyone asks you for a fee, use **Report** and pick “Broker, or a fee was asked for”." },
        ],
      },
      {
        id: "new-address",
        heading: "Also new: our own address",
        body: [
          { type: "p", text: "We now live at **gharmatch.space**. The old gharmatch.vercel.app link sends you there, so saved links keep working." },
          { type: "p", text: "If we ever need the site offline for a short while, you will see the friendly “Back soon” page instead of an error." },
        ],
      },
      {
        id: "privacy-update",
        heading: "Privacy policy update",
        body: [
          { type: "p", text: "We updated the Privacy Policy so it says exactly what the new tools show. In plain words:" },
          { type: "list", items: [
            "Landlords see the “about this account” card, and your answers to their questions.",
            "If you delete your account while a safety report about you is open or upheld, we keep a scrambled fingerprint of your email, not the email, for up to a year. It cannot be turned back into your address.",
            "Our team can look up the name, email and phone behind an account only for a safety report or a lawful request. Each lookup needs a written reason and is logged.",
          ] },
          { type: "callout", text: "Because the policy changed, you will be asked to agree once more the next time you sign in. It takes one tap." },
        ],
      },
    ],
  },
  {
    slug: "gharmatch-is-live",
    title: "Gharmatch is live in Ahmedabad and Gandhinagar",
    date: "2026-11-08",
    tag: "News",
    summary: "Gharmatch is a free, open-source way to find a rental that fits. Landlords share their house rules, tenants share what they need, and we show the match first.",
    keyPoints: [
      "Gharmatch is live for Ahmedabad and Gandhinagar. It is free and open source.",
      "Landlords post house rules. Tenants post needs. You see the match and any clash first.",
      "Phone and email stay hidden until the landlord accepts.",
      "No religion, caste or community fields. Women's searches show as “Verified tenant”.",
      "Visit tools, a trusted contact, reports and blocking are built in.",
    ],
    sections: [
      {
        id: "what-it-is",
        heading: "What Gharmatch is",
        body: [
          { type: "p", text: "Finding a rental often means long phone calls, and learning after a day that the flat is “veg only” or “no bachelors”. We wanted to fix that." },
          { type: "p", text: "On Gharmatch, landlords write their **house rules**. Tenants write what they need. We show how well they fit, and which rules clash, **before anyone sends a message**." },
          { type: "callout", text: "The match score is a plain set of rules. It is not AI, and you can see exactly why a home fits or clashes." },
        ],
      },
      {
        id: "how-it-works",
        heading: "How it works",
        body: [
          { type: "list", items: [
            "A landlord posts a home with its rent, rules and photos.",
            "A tenant posts a search: budget, area, move-in date and habits.",
            "Each home shows the match, with any clash spelled out.",
            "The tenant sends a short note. The landlord accepts or declines.",
            "Only after an accept do contact details open, to those two people.",
          ] },
        ],
      },
      {
        id: "safety-first",
        heading: "Safety comes first",
        body: [
          { type: "p", text: "Phone numbers and emails stay hidden until a landlord accepts. The exact address stays hidden too, and the public map shows only the area." },
          { type: "p", text: "There are **no religion, caste or community fields**, and a text check blocks them in free text. Homes are about rules, not about who you are." },
          { type: "p", text: "Searches by women and mixed groups appear to landlords as **“Verified tenant”**, with no name or introduction, until the tenant replies." },
          { type: "list", items: [
            "Plan a visit, and tell the owner who is coming",
            "Check in when you arrive and check out when you leave",
            "Save one trusted contact, and share your plan with a tap",
            "Report or block anyone, from your dashboard",
          ] },
        ],
      },
      {
        id: "free-and-open",
        heading: "Free and open",
        body: [
          { type: "p", text: "Gharmatch is **free**, with no ads, and the code is public for anyone to read. It runs on free hosting, so it can sometimes be slow." },
          { type: "p", text: "Homes stay listed for 30 days, then ask the landlord if they are still available. That keeps the list fresh." },
          { type: "callout", text: "Got a home to rent, or looking for one? Both take about two minutes to post." },
        ],
      },
    ],
  },
];
