import { NextResponse } from "next/server";
import { visitIcs } from "@/lib/ics";
import { getDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { currentActor } from "@/server/session";
import { getVisitForCalendar } from "@/server/visits";

export const dynamic = "force-dynamic";

/** Calendar file for one visit. Only the two people on the visit can download it. It carries the area, not the address. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const v = await getVisitForCalendar(getDb(), await currentActor(), (await params).id);
    const body = visitIcs({ id: v.id, start: v.scheduledAt, title: v.listing.title, area: v.listing.area, representative: v.representativeName });
    return new NextResponse(body, {
      headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "attachment; filename=home-visit.ics", "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    const status = e instanceof AppError && e.code === "UNAUTHENTICATED" ? 401 : 404;
    return NextResponse.json({ error: "Not found" }, { status });
  }
}
