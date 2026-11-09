import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Slider } from "@/components/listing/Slider";
import { MatchPanel } from "@/components/listing/MatchPanel";
import { ReportButton } from "@/components/listing/ReportButton";
import { VisitTools } from "@/components/listing/VisitTools";
import { LivingDisclosures } from "@/components/listing/LivingDisclosures";
import { MapSection } from "@/components/listing/MapSection";
import { SafetyAssessment } from "@/components/listing/SafetyAssessment";
import { TrustIndicators } from "@/components/listing/TrustIndicators";
import { EmergencyStrip } from "@/components/site/EmergencyStrip";
import { inr, label, pick } from "@/lib/labels";
import { approximate, areaCentre, type Point } from "@/lib/location";
import { SAFETY_TIPS_ALL, SAFETY_TIPS_WOMEN } from "@/lib/safety";
import { sampleListings } from "@/lib/sampleListings";
import { getDb } from "@/server/db";
import { photoUrls } from "@/server/storage";
import { getApproxLocation, getPublicListing } from "@/server/listings";

export const revalidate = 3600;

/** No pages are built ahead of time. Each home is rendered on first visit, then served from cache for an hour. */
export async function generateStaticParams() {
  return [];
}

type Detail = NonNullable<Awaited<ReturnType<typeof getPublicListing>>>;

/** Fills a development sample out to a full listing so the page can be reviewed without a database. */
function sampleDetail(slug: string): Detail | null {
  const s = sampleListings.find((l) => l.slug === slug);
  if (!s || process.env.DATABASE_URL || process.env.NODE_ENV === "production") return null;
  return {
    id: s.slug, slug: s.slug, title: s.title, city: s.city as Detail["city"], area: s.area, rent: s.rent, deposit: s.rent * 2, bhk: s.bhk,
    furnishing: s.furnishing, availableFrom: new Date(Date.now() + 12 * 86_400_000),
    description: "Sample text for design review. Real listings carry the landlord's own description of the home and the lane.",
    dietPolicy: s.dietPolicy, tenantTypes: ["FAMILY", "BACHELORS", "WORKING_WOMEN"], genderPolicy: s.genderPolicy,
    securityFeatures: s.securityFeatures, pets: "CASE_BY_CASE", smoking: "OUTDOORS_ONLY", alcohol: "NOT_ALLOWED",
    visitors: "DAYTIME_ONLY", quietHours: "After 10 pm", minLeaseMonths: 11, noticeDays: 30, parking: "TWO_WHEELER",
    wfhAllowed: true, maxOccupants: 3, lastConfirmedAt: new Date(), postedBy: "OWNER", photos: [],
    cctvLocations: "Main gate and parking (sample)", cctvAccess: "Society committee only (sample)", occupancyNote: "Sample text: two other tenants in the building, all families.",
    ownerLivesOnSite: false, keyHolders: "TENANT_ONLY", ownerAccess: "WITH_NOTICE", noticeHours: 24,
    locationStatus: "MATCHES_AREA", locationCheckedAt: new Date(), ownershipReviewedAt: null, ownershipDocType: null,
    owner: { emailVerified: null, identityCheckedAt: null, identityMethod: null }, inspections: [],
  };
}

async function load(slug: string): Promise<{ listing: Detail; sample: boolean; approx: Point | null } | null> {
  const sample = sampleDetail(slug);
  if (sample) {
    const c = areaCentre(sample.area);
    return { listing: sample, sample: true, approx: c ? approximate(c) : null };
  }
  if (!process.env.DATABASE_URL) return null;
  const listing = await getPublicListing(getDb(), slug);
  if (!listing) return null;
  return { listing, sample: false, approx: await getApproxLocation(getDb(), listing.id) };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) return { title: "Home not found", robots: { index: false } };
  const l = found.listing;
  return {
    title: `${l.bhk} BHK in ${l.area}, ${l.city === "AHMEDABAD" ? "Ahmedabad" : "Gandhinagar"}: ${inr(l.rent)}`,
    description: `${l.title}. ${pick(label.furnishing, l.furnishing)}, ${pick(label.diet, l.dietPolicy).toLowerCase()}. See the house rules and how they fit you.`,
    robots: found.sample ? { index: false } : undefined,
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = await load(slug);
  if (!found) notFound();
  const { listing: l, sample, approx } = found;
  const inspection = l.inspections[0] ?? null;

  const rules: Array<[string, string]> = [
    ["Food", pick(label.diet, l.dietPolicy)],
    ["Who it is for", pick(label.gender, l.genderPolicy)],
    ["Household", l.tenantTypes.map((t) => pick(label.tenantType, t)).join(", ")],
    ["Pets", pick(label.pets, l.pets)],
    ["Smoking", pick(label.habit, l.smoking)],
    ["Alcohol", pick(label.habit, l.alcohol)],
    ["Visitors", pick(label.visitors, l.visitors)],
    ["Quiet hours", l.quietHours ?? "None stated"],
    ["Lease", `${l.minLeaseMonths} months minimum, ${l.noticeDays} days notice`],
    ["Parking", pick(label.parking, l.parking)],
    ["Work from home", l.wfhAllowed ? "Allowed" : "Not allowed"],
    ["Most people", String(l.maxOccupants)],
  ];

  return (
    <main className="mx-auto max-w-6xl px-6 pb-28 pt-28">
      <div className="relative aspect-[16/7] overflow-hidden rounded-2xl border border-line">
        <Slider images={photoUrls(l.photos.map((x) => x.objectKey))} seed={l.slug} title={l.title} artSlides={sample ? 3 : 1} className="absolute inset-0" />
        {sample ? <span className="absolute left-4 top-4 rounded-full bg-lamp px-3 py-1 text-xs font-medium text-void">Sample</span> : null}
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <p className="index">{l.area}, {l.city === "AHMEDABAD" ? "Ahmedabad" : "Gandhinagar"} · {l.bhk} BHK · {pick(label.furnishing, l.furnishing)}</p>
          <h1 className="display mt-4 text-4xl sm:text-6xl">{l.title}</h1>
          <p className="mt-6 font-mono text-3xl">{inr(l.rent)}<span className="text-base text-faint"> / month</span></p>
          <p className="mt-1 font-mono text-sm text-faint">Deposit {inr(l.deposit)} · Available {l.availableFrom.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          <p className="mt-8 max-w-2xl whitespace-pre-line text-[17px] leading-relaxed text-soft">{l.description}</p>
          <p className="mt-6 text-sm text-faint">
            {pick(label.postedByPublic, l.postedBy)}.
            {l.postedBy === "AGENT" ? " No fee or commission is allowed. Never pay anyone before you have seen the home, and report a request for money." : ""}
          </p>

          <h2 className="index mt-14">House rules</h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {rules.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-3.5 text-[15px]">
                <dt className="text-faint">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-12 space-y-6">
            <MapSection
              approx={approx}
              area={l.area}
              locationStatus={l.locationStatus}
              checkedAt={l.locationCheckedAt ? l.locationCheckedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null}
              embedKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY || undefined}
            />
            <TrustIndicators
              identityCheckedAt={l.owner.identityCheckedAt}
              identityMethod={l.owner.identityMethod}
              ownershipReviewedAt={l.ownershipReviewedAt}
              ownershipDocType={l.ownershipDocType}
              inspectedAt={inspection?.inspectedAt ?? null}
            />
            <SafetyAssessment declared={l.securityFeatures} inspection={inspection} cctvLocations={l.cctvLocations} cctvAccess={l.cctvAccess} />
            <LivingDisclosures
              ownerLivesOnSite={l.ownerLivesOnSite}
              occupancyNote={l.occupancyNote}
              keyHolders={l.keyHolders}
              ownerAccess={l.ownerAccess}
              noticeHours={l.noticeHours}
              visitors={l.visitors}
            />
          </div>

          <h2 className="index mt-12">Before you visit</h2>
          <ul className="mt-4 space-y-2 text-[15px] text-soft">
            {SAFETY_TIPS_ALL.map((t) => <li key={t}>· {t}</li>)}
          </ul>
          <details className="mt-6 rounded-2xl border border-line px-5 py-4">
            <summary className="cursor-pointer text-[15px]">Extra care if you are a woman or going alone</summary>
            <ul className="mt-4 space-y-2 text-[15px] text-soft">
              {SAFETY_TIPS_WOMEN.map((t) => <li key={t}>· {t}</li>)}
            </ul>
          </details>
          <div className="mt-6"><VisitTools title={l.title} area={l.area} slug={l.slug} /></div>

          <h2 className="index mt-12">In an emergency</h2>
          <EmergencyStrip compact className="mt-4" />
          <div className="mt-10"><ReportButton targetType="LISTING" targetId={l.id} /></div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {sample ? <p className="rounded-2xl border border-line p-6 text-sm text-soft">Matching is shown here on real listings.</p> : <MatchPanel listingId={l.id} slug={l.slug} />}
        </aside>
      </div>
    </main>
  );
}
