import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getDb } from "@/server/db";
import { AppError } from "@/server/errors";
import { makeCover, removePhoto } from "@/server/photos";
import { currentActor } from "@/server/session";
import { getStorage } from "@/server/storage";

export const dynamic = "force-dynamic";

function fail(e: unknown) {
  if (e instanceof AppError) {
    return NextResponse.json({ error: e.message }, { status: e.code === "UNAUTHENTICATED" ? 401 : e.code === "NOT_FOUND" ? 404 : 400 });
  }
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ photoId: string }> }) {
  try {
    await removePhoto(getDb(), getStorage(), await currentActor(), (await params).photoId);
    revalidatePath("/listings");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}

/** PATCH makes this photo the cover. */
export async function PATCH(_: Request, { params }: { params: Promise<{ photoId: string }> }) {
  try {
    await makeCover(getDb(), await currentActor(), (await params).photoId);
    revalidatePath("/listings");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
