"use client";

import { AnimatePresence, m } from "motion/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MAX_PHOTOS_PER_LISTING, MAX_PHOTO_BYTES } from "@/lib/domain";
import { spring } from "@/lib/motion";

export interface PhotoItem {
  id: string;
  url: string;
}

const LONG_EDGE = 1280;

/** Shrinks to WebP (or JPEG where WebP cannot be encoded) until the file is under the server limit. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const type of ["image/webp", "image/jpeg"]) {
    for (let q = 0.84; q >= 0.4; q -= 0.12) {
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
      if (blob && blob.type === type && blob.size <= MAX_PHOTO_BYTES) return blob;
    }
  }
  throw new Error("This photo is too detailed to shrink enough. Try a smaller one.");
}

export function PhotoManager({ listingId, initial, enabled }: { listingId: string; initial: PhotoItem[]; enabled: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    try {
      let count = photos.length;
      for (const file of Array.from(files)) {
        if (count >= MAX_PHOTOS_PER_LISTING) {
          setError(`You can add up to ${MAX_PHOTOS_PER_LISTING} photos.`);
          break;
        }
        const blob = await shrink(file);
        const body = new FormData();
        body.set("photo", blob, "photo");
        const res = await fetch(`/api/listings/${listingId}/photos`, { method: "POST", body });
        const json = (await res.json()) as { id?: string; url?: string | null; error?: string };
        if (!res.ok || !json.id) throw new Error(json.error ?? "Upload failed.");
        if (json.url) setPhotos((p) => [...p, { id: json.id!, url: json.url! }]);
        count += 1;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPhotos((p) => p.filter((x) => x.id !== id));
      router.refresh();
    } else setError("Could not delete that photo.");
  }

  async function cover(id: string) {
    const res = await fetch(`/api/photos/${id}`, { method: "PATCH" });
    if (res.ok) {
      setPhotos((p) => {
        const hit = p.find((x) => x.id === id);
        return hit ? [hit, ...p.filter((x) => x.id !== id)] : p;
      });
      router.refresh();
    } else setError("Could not change the cover.");
  }

  if (!enabled) {
    return <p className="rounded-2xl border border-line p-5 text-sm text-soft">Photo upload is switched off until storage is configured.</p>;
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <AnimatePresence initial={false}>
          {photos.map((p, i) => (
            <m.li
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={spring.smooth}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-surface"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`Photo ${i + 1}`} className="size-full object-cover" />
              {i === 0 ? <span className="absolute left-2 top-2 rounded-md bg-lamp px-2 py-1 font-mono text-[10px] uppercase text-void">Cover</span> : null}
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-2 bg-gradient-to-t from-void/90 to-transparent p-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {i > 0 ? <button type="button" onClick={() => cover(p.id)} className="rounded-full bg-text px-3 py-1 text-xs text-void">Make cover</button> : <span />}
                <button type="button" onClick={() => remove(p.id)} className="rounded-full border border-danger/60 px-3 py-1 text-xs text-danger">Remove</button>
              </div>
            </m.li>
          ))}
        </AnimatePresence>
        {photos.length < MAX_PHOTOS_PER_LISTING ? (
          <li>
            <button
              type="button"
              disabled={busy}
              onClick={() => input.current?.click()}
              className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-line-strong text-sm text-soft transition-colors hover:border-soft hover:text-text disabled:opacity-60"
            >
              {busy ? "Uploading…" : "+ Add photos"}
            </button>
          </li>
        ) : null}
      </ul>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      <p className="mt-3 text-xs text-faint">Up to {MAX_PHOTOS_PER_LISTING} photos. They are shrunk on your device first. The first photo is the cover. Do not include faces, number plates or documents.</p>
      {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
