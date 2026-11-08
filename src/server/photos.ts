import { randomBytes } from "node:crypto";
import { MAX_PHOTOS_PER_LISTING, MAX_PHOTO_BYTES } from "@/lib/domain";
import { EXTENSION, sniffImage } from "@/lib/imageSniff";
import { requireActiveUser, type Actor } from "./actor";
import type { Db } from "./db";
import { AppError } from "./errors";
import { enforce, type RateLimiter } from "./rateLimit";
import type { PhotoStorage } from "./storage";

async function ownedListing(db: Db, userId: string, listingId: string) {
  const l = await db.listing.findUnique({ where: { id: listingId }, select: { id: true, ownerId: true, status: true } });
  if (!l || l.ownerId !== userId || l.status === "DELETED") throw new AppError("NOT_FOUND", "Listing not found.");
  return l;
}

export async function addPhoto(
  db: Db, storage: PhotoStorage | null, limiter: RateLimiter, actor: Actor | null, listingId: string, bytes: Uint8Array,
) {
  const user = await requireActiveUser(db, actor);
  await ownedListing(db, user.id, listingId);
  if (!storage) throw new AppError("INVALID", "Photo upload is not available right now.");
  await enforce(limiter, "upload", user.id);

  if (bytes.byteLength === 0 || bytes.byteLength > MAX_PHOTO_BYTES) {
    throw new AppError("INVALID", `Each photo must be under ${Math.round(MAX_PHOTO_BYTES / 1024)} KB. The page shrinks photos for you.`);
  }
  const kind = sniffImage(bytes);
  if (!kind) throw new AppError("INVALID", "Only JPEG and WebP photos are accepted.");

  const count = await db.listingPhoto.count({ where: { listingId } });
  if (count >= MAX_PHOTOS_PER_LISTING) throw new AppError("INVALID", `You can add up to ${MAX_PHOTOS_PER_LISTING} photos.`);

  const objectKey = `listings/${listingId}/${randomBytes(9).toString("hex")}.${EXTENSION[kind]}`;
  await storage.put(objectKey, bytes, kind);
  try {
    return await db.listingPhoto.create({
      data: { listingId, objectKey, contentType: kind, bytes: bytes.byteLength, position: count },
      select: { id: true, objectKey: true },
    });
  } catch (e) {
    await storage.remove(objectKey).catch(() => undefined);
    throw e;
  }
}

export async function removePhoto(db: Db, storage: PhotoStorage | null, actor: Actor | null, photoId: string) {
  const user = await requireActiveUser(db, actor);
  const photo = await db.listingPhoto.findUnique({
    where: { id: photoId },
    select: { id: true, objectKey: true, listingId: true, listing: { select: { ownerId: true } } },
  });
  if (!photo || photo.listing.ownerId !== user.id) throw new AppError("NOT_FOUND", "Photo not found.");
  await db.listingPhoto.delete({ where: { id: photo.id } });
  await storage?.remove(photo.objectKey).catch(() => undefined);

  const rest = await db.listingPhoto.findMany({ where: { listingId: photo.listingId }, orderBy: { position: "asc" }, select: { id: true }, take: MAX_PHOTOS_PER_LISTING });
  await db.$transaction(rest.map((p, i) => db.listingPhoto.update({ where: { id: p.id }, data: { position: i } })));
}

/** Moves one photo to the front. The first photo is the cover shown on cards. */
export async function makeCover(db: Db, actor: Actor | null, photoId: string) {
  const user = await requireActiveUser(db, actor);
  const photo = await db.listingPhoto.findUnique({ where: { id: photoId }, select: { id: true, listingId: true, listing: { select: { ownerId: true } } } });
  if (!photo || photo.listing.ownerId !== user.id) throw new AppError("NOT_FOUND", "Photo not found.");
  const all = await db.listingPhoto.findMany({ where: { listingId: photo.listingId }, orderBy: { position: "asc" }, select: { id: true }, take: MAX_PHOTOS_PER_LISTING });
  const order = [photo.id, ...all.map((p) => p.id).filter((id) => id !== photo.id)];
  await db.$transaction(order.map((id, i) => db.listingPhoto.update({ where: { id }, data: { position: i } })));
}

export async function listOwnPhotos(db: Db, actor: Actor | null, listingId: string) {
  const user = await requireActiveUser(db, actor);
  await ownedListing(db, user.id, listingId);
  return db.listingPhoto.findMany({
    where: { listingId },
    orderBy: { position: "asc" },
    take: MAX_PHOTOS_PER_LISTING,
    select: { id: true, objectKey: true },
  });
}
