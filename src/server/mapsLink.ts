import { parseCoordinates, type Point } from "@/lib/location";

/** Only these hosts are ever contacted. Anything else in a pasted link is refused, which prevents the server being aimed elsewhere. */
const ALLOWED_HOSTS = new Set(["maps.app.goo.gl", "goo.gl", "www.google.com", "google.com", "maps.google.com", "www.google.co.in", "google.co.in"]);
const MAX_HOPS = 4;

export type Fetcher = (url: string) => Promise<{ status: number; location: string | null }>;

const realFetcher: Fetcher = async (url) => {
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(4000), headers: { "User-Agent": "Mozilla/5.0 (compatible; Gharmatch/1.0)" } });
  return { status: res.status, location: res.headers.get("location") };
};

function allowed(raw: string): URL | null {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && ALLOWED_HOSTS.has(u.hostname) ? u : null;
  } catch {
    return null;
  }
}

/**
 * Turns pasted text into coordinates. Accepts plain coordinates, full Google Maps links, and short
 * maps.app.goo.gl links (by following their redirects, only to Google hosts, a few hops at most).
 * Returns null when nothing usable is found.
 */
export async function resolveLocation(input: string, fetcher: Fetcher = realFetcher): Promise<Point | null> {
  const text = input.trim().slice(0, 600);
  const direct = parseCoordinates(text);
  if (direct) return direct;

  let current = allowed(text);
  for (let hop = 0; current && hop < MAX_HOPS; hop++) {
    const fromUrl = parseCoordinates(decodeURIComponent(current.toString()));
    if (fromUrl) return fromUrl;
    let res;
    try {
      res = await fetcher(current.toString());
    } catch {
      return null;
    }
    if (res.status < 300 || res.status >= 400 || !res.location) return null;
    current = allowed(new URL(res.location, current).toString());
  }
  return null;
}
