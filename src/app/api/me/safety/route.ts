import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { currentActor } from "@/server/session";

export const dynamic = "force-dynamic";

/** The signed-in person's own trusted contact, so the listing page can address a visit message to them. */
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ contact: null }, { headers });
  const u = await getDb().user.findUnique({
    where: { id: actor.id },
    select: { trustedContactName: true, trustedContactPhone: true },
  });
  const contact = u?.trustedContactName && u.trustedContactPhone ? { name: u.trustedContactName, phone: u.trustedContactPhone } : null;
  return NextResponse.json({ contact }, { headers });
}
