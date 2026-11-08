import { NextResponse } from "next/server";
import { matchListing } from "@/lib/matching";
import { getDb } from "@/server/db";
import { listingFacts, requirementFacts } from "@/server/interests";
import { currentActor } from "@/server/session";

export const dynamic = "force-dynamic";

/** Match results for the signed-in tenant's own active searches. No contact data, no other users' data. */
export async function GET(_: Request, { params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = await params;
  const actor = await currentActor();
  const headers = { "Cache-Control": "private, no-store" };
  if (!actor) return NextResponse.json({ signedIn: false, searches: [] }, { headers });

  const db = getDb();
  const [listing, searches] = await Promise.all([
    db.listing.findFirst({
      where: { id: listingId, status: "ACTIVE", expiresAt: { gt: new Date() } },
      select: {
        id: true, ownerId: true, city: true, area: true, rent: true, availableFrom: true, dietPolicy: true,
        tenantTypes: true, pets: true, smoking: true, alcohol: true, minLeaseMonths: true, maxOccupants: true,
        genderPolicy: true, securityFeatures: true,
      },
    }),
    db.requirement.findMany({
      where: { tenantId: actor.id, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, city: true, areas: true, budgetMin: true, budgetMax: true, moveInDate: true, tenantType: true,
        diet: true, pets: true, smoking: true, alcohol: true, durationMonths: true, occupants: true,
        occupantGroup: true, needsSecurity: true, intro: true,
      },
    }),
  ]);
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404, headers });

  const facts = listingFacts(listing);
  return NextResponse.json(
    {
      signedIn: true,
      isOwner: listing.ownerId === actor.id,
      searches: searches.map((s) => ({
        id: s.id,
        label: `${s.areas.slice(0, 2).join(", ")} · up to ₹${s.budgetMax.toLocaleString("en-IN")}`,
        result: matchListing(requirementFacts(s), facts),
      })),
    },
    { headers },
  );
}
