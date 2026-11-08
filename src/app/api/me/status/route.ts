import { NextResponse } from "next/server";
import { currentActor } from "@/server/session";

export const dynamic = "force-dynamic";

/** Whether anyone is signed in. Reads the JWT only, so it never wakes the database. The header uses it, which keeps public pages cacheable. */
export async function GET() {
  const actor = await currentActor();
  return NextResponse.json({ signedIn: Boolean(actor) }, { headers: { "Cache-Control": "private, no-store" } });
}
