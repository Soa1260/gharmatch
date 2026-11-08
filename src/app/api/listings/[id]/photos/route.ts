import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { MAX_PHOTO_BYTES } from "@/lib/domain";
import { getDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { addPhoto } from "@/server/photos";
import { PostgresRateLimiter } from "@/server/rateLimit";
import { currentActor } from "@/server/session";
import { getStorage } from "@/server/storage";

export const dynamic = "force-dynamic";

/** One photo per request, already shrunk by the browser. Size and real file type are checked again here. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_PHOTO_BYTES * 3) return NextResponse.json({ error: "File too large." }, { status: 413 });

  // Know who is calling before reading a single byte of their upload. The service checks again and owns the real rules.
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new AppError("INVALID", "That was not a photo upload.");
    }
    const file = form.get("photo");
    if (!(file instanceof File)) throw new AppError("INVALID", "No photo received.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const db = getDb();
    const row = await addPhoto(db, getStorage(), new PostgresRateLimiter(db), actor, id, bytes);
    revalidatePath("/listings");
    return NextResponse.json({ id: row.id, url: getStorage()?.urlFor(row.objectKey) ?? null });
  } catch (e) {
    if (e instanceof AppError) {
      const status = e.code === "UNAUTHENTICATED" ? 401 : e.code === "NOT_FOUND" ? 404 : e.code === "RATE_LIMITED" ? 429 : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    console.error(JSON.stringify({ level: "error", msg: "photo upload failed" }));
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
