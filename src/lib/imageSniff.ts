export type ImageKind = "image/webp" | "image/jpeg";

/**
 * Decides what a file really is from its first bytes. The browser-declared type is never trusted,
 * so a renamed script or SVG cannot be stored as a photo.
 */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length < 12) return null;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (jpeg) return "image/jpeg";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  return null;
}

export const EXTENSION: Record<ImageKind, string> = { "image/webp": "webp", "image/jpeg": "jpg" };
