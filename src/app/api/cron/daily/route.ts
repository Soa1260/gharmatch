import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { runDailyMaintenance } from "@/server/maintenance";

export const dynamic = "force-dynamic";

function authorised(header: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const want = Buffer.from(secret);
  return given.length === want.length && timingSafeEqual(given, want);
}

/** Called once a day by Vercel Cron, which sends `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: Request) {
  if (!authorised(req.headers.get("authorization"))) return new NextResponse("Unauthorized", { status: 401 });
  const result = await runDailyMaintenance(getDb());
  revalidateTag("listings", "max");
  return NextResponse.json(result);
}
