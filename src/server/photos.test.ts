import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { MAX_PHOTOS_PER_LISTING } from "@/lib/domain";
import { sniffImage } from "@/lib/imageSniff";
import { createTestDb, makeUser, validListing } from "@/test/testDb";
import type { Db } from "./db";
import { createListing } from "./listings";
import { addPhoto, listOwnPhotos, makeCover, removePhoto } from "./photos";
import { PostgresRateLimiter } from "./rateLimit";
import type { PhotoStorage } from "./storage";

class MemoryStorage implements PhotoStorage {
  files = new Map<string, Uint8Array>();
  async put(key: string, bytes: Uint8Array) { this.files.set(key, bytes); }
  async remove(key: string) { this.files.delete(key); }
  urlFor(key: string) { return `https://cdn.test/${key}`; }
}

const webp = (size = 2000) => {
  const b = new Uint8Array(size);
  b.set([0x52, 0x49, 0x46, 0x46], 0);
  b.set([0x57, 0x45, 0x42, 0x50], 8);
  return b;
};
const jpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const svg = () => new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');

let db: Db;
let close: () => Promise<void>;
let limiter: PostgresRateLimiter;
let storage: MemoryStorage;

beforeAll(async () => {
  ({ db, close } = await createTestDb());
  limiter = new PostgresRateLimiter(db);
  storage = new MemoryStorage();
});
afterAll(async () => close());

async function home() {
  const landlord = await makeUser(db, { isLandlord: true });
  const listing = await createListing(db, limiter, landlord, validListing);
  return { landlord, listing };
}

describe("sniffImage", () => {
  it("recognises JPEG and WebP by their bytes and nothing else", () => {
    expect(sniffImage(webp())).toBe("image/webp");
    expect(sniffImage(jpeg())).toBe("image/jpeg");
    expect(sniffImage(svg())).toBeNull();
    expect(sniffImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10, 0, 0, 0, 0]))).toBeNull();
  });
});

describe("photos", () => {
  it("stores a photo for the owner and lists it in order", async () => {
    const { landlord, listing } = await home();
    const p = await addPhoto(db, storage, limiter, landlord, listing.id, webp());
    expect(storage.files.has(p.objectKey)).toBe(true);
    expect((await listOwnPhotos(db, landlord, listing.id)).map((x) => x.id)).toEqual([p.id]);
  });

  it("rejects other people's listings, fake images, oversize files and missing storage", async () => {
    const { landlord, listing } = await home();
    const stranger = await makeUser(db, { isLandlord: true });
    await expect(addPhoto(db, storage, limiter, stranger, listing.id, webp())).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addPhoto(db, storage, limiter, landlord, listing.id, svg())).rejects.toMatchObject({ code: "INVALID" });
    await expect(addPhoto(db, storage, limiter, landlord, listing.id, webp(500 * 1024))).rejects.toMatchObject({ code: "INVALID" });
    await expect(addPhoto(db, null, limiter, landlord, listing.id, webp())).rejects.toMatchObject({ code: "INVALID" });
    expect(await db.listingPhoto.count({ where: { listingId: listing.id } })).toBe(0);
  });

  it("stops at the photo limit", async () => {
    const { landlord, listing } = await home();
    for (let i = 0; i < MAX_PHOTOS_PER_LISTING; i++) await addPhoto(db, storage, limiter, landlord, listing.id, webp());
    await expect(addPhoto(db, storage, limiter, landlord, listing.id, webp())).rejects.toMatchObject({ code: "INVALID" });
  });

  it("lets only the owner remove or reorder, and deletes the stored file", async () => {
    const { landlord, listing } = await home();
    const a = await addPhoto(db, storage, limiter, landlord, listing.id, webp());
    const b = await addPhoto(db, storage, limiter, landlord, listing.id, webp());
    const stranger = await makeUser(db, { isLandlord: true });
    await expect(removePhoto(db, storage, stranger, a.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(makeCover(db, stranger, b.id)).rejects.toMatchObject({ code: "NOT_FOUND" });

    await makeCover(db, landlord, b.id);
    expect((await listOwnPhotos(db, landlord, listing.id)).map((x) => x.id)).toEqual([b.id, a.id]);

    await removePhoto(db, storage, landlord, b.id);
    expect(storage.files.has(b.objectKey)).toBe(false);
    const left = await db.listingPhoto.findMany({ where: { listingId: listing.id } });
    expect(left.map((x) => x.position)).toEqual([0]);
  });
});
