import type { Metadata } from "next";
import { OnboardingForm } from "@/components/form/OnboardingForm";
import { POLICY_VERSION } from "@/lib/legal";
import { getDb } from "@/server/db";
import { requireSignedIn } from "@/server/session";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Onboarding({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/dashboard" } = await searchParams;
  const actor = await requireSignedIn("/onboarding");
  // Someone coming back to add a number or a role keeps what they already saved. Phone is omitted from queries unless asked for.
  const saved = await getDb().user.findUnique({
    where: { id: actor.id },
    select: { name: true, phone: true, isLandlord: true, isTenant: true, onboarded: true, termsVersion: true },
  });
  const needsAgreement = saved?.termsVersion !== POLICY_VERSION;
  const roles = saved?.onboarded ? [saved.isTenant ? "tenant" : "", saved.isLandlord ? "landlord" : ""].filter(Boolean) : ["tenant"];
  return (
    <main className="mx-auto max-w-2xl px-6 pb-24 pt-36">
      <p className="index">{saved?.onboarded ? "Your profile" : "Step 1 of 1"}</p>
      <h1 className="display mt-6 text-5xl sm:text-7xl">{saved?.onboarded ? "Update your details." : "Tell us a little."}</h1>
      <p className="mt-5 max-w-md text-[17px] leading-relaxed text-soft">
        Your name and role. A mobile number is needed to rent out a home, and optional for tenants. It stays hidden and is shared only when an interest is accepted.
      </p>
      <OnboardingForm next={next} needsAgreement={needsAgreement} initial={{ name: saved?.name ?? "", phone: saved?.phone ?? "", roles }} />
    </main>
  );
}
