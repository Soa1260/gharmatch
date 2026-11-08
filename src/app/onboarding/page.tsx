import type { Metadata } from "next";
import { OnboardingForm } from "@/components/form/OnboardingForm";
import { requireSignedIn } from "@/server/session";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  await requireSignedIn("/onboarding");
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-36">
      <p className="index">Step 1 of 1</p>
      <h1 className="display mt-6 text-5xl sm:text-7xl">Tell us a little.</h1>
      <p className="mt-5 max-w-md text-[17px] leading-relaxed text-soft">
        Your name and role. A phone number is optional, stays hidden, and is shared only when an interest is accepted.
      </p>
      <OnboardingForm next={next} />
    </main>
  );
}
