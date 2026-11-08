import type { City } from "./domain";

export interface Point {
  lat: number;
  lng: number;
}

/** Generous boxes around each city. A point outside is not in Ahmedabad or Gandhinagar and is refused. */
const CITY_BOUNDS: Record<City, { south: number; north: number; west: number; east: number }> = {
  AHMEDABAD: { south: 22.88, north: 23.2, west: 72.3, east: 72.75 },
  GANDHINAGAR: { south: 23.1, north: 23.4, west: 72.5, east: 72.8 },
};

/**
 * Rough centres of each area, from general knowledge of the cities, NOT surveyed data.
 * They are used only for a soft check: a pin far from the chosen area is held for a person to look at,
 * never rejected on this alone. Review these with someone who knows the neighbourhoods.
 */
const AREA_CENTRES: Record<string, Point> = {
  Bopal: { lat: 23.03, lng: 72.465 },
  "South Bopal": { lat: 23.012, lng: 72.465 },
  Shela: { lat: 23.0, lng: 72.47 },
  Thaltej: { lat: 23.05, lng: 72.505 },
  Bodakdev: { lat: 23.04, lng: 72.51 },
  Satellite: { lat: 23.03, lng: 72.52 },
  Vastrapur: { lat: 23.035, lng: 72.53 },
  Navrangpura: { lat: 23.04, lng: 72.56 },
  Maninagar: { lat: 22.99, lng: 72.6 },
  Naroda: { lat: 23.07, lng: 72.65 },
  Chandkheda: { lat: 23.1, lng: 72.58 },
  Gota: { lat: 23.1, lng: 72.54 },
  "SG Highway": { lat: 23.05, lng: 72.5 },
  Prahladnagar: { lat: 23.01, lng: 72.51 },
  Sanand: { lat: 22.99, lng: 72.38 },
  Ghatlodia: { lat: 23.08, lng: 72.55 },
  Ambawadi: { lat: 23.03, lng: 72.55 },
  Paldi: { lat: 23.01, lng: 72.56 },
  Kudasan: { lat: 23.19, lng: 72.64 },
  Sargasan: { lat: 23.19, lng: 72.62 },
  Raysan: { lat: 23.17, lng: 72.65 },
  Randesan: { lat: 23.17, lng: 72.65 },
  Koba: { lat: 23.16, lng: 72.63 },
  Infocity: { lat: 23.19, lng: 72.64 },
  "GIFT City": { lat: 23.16, lng: 72.68 },
  Adalaj: { lat: 23.17, lng: 72.58 },
  Vavol: { lat: 23.25, lng: 72.62 },
  Pethapur: { lat: 23.27, lng: 72.52 },
};
const GANDHINAGAR_CENTRE: Point = { lat: 23.22, lng: 72.65 };
const AREA_RADIUS_KM = 8;
const SECTOR_RADIUS_KM = 12;

export type LocationStatus = "NOT_PROVIDED" | "MATCHES_AREA" | "FAR_FROM_AREA";

export function haversineKm(a: Point, b: Point): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function inCityBounds(city: City, p: Point): boolean {
  const b = CITY_BOUNDS[city];
  return p.lat >= b.south && p.lat <= b.north && p.lng >= b.west && p.lng <= b.east;
}

export type LocationCheck = { ok: true; status: "MATCHES_AREA" | "FAR_FROM_AREA"; distanceKm: number } | { ok: false; reason: string };

/** Is this point plausibly where the landlord says it is? Not proof of ownership or that a building exists. */
export function checkLocation(city: City, area: string, p: Point): LocationCheck {
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat) > 90 || Math.abs(p.lng) > 180) {
    return { ok: false, reason: "That is not a valid map location." };
  }
  if (!inCityBounds(city, p)) {
    return { ok: false, reason: `That location is not in ${city === "AHMEDABAD" ? "Ahmedabad" : "Gandhinagar"}.` };
  }
  const isSector = /^Sector \d+$/.test(area);
  const centre = isSector ? GANDHINAGAR_CENTRE : AREA_CENTRES[area];
  if (!centre) return { ok: true, status: "FAR_FROM_AREA", distanceKm: 0 };
  const distanceKm = haversineKm(p, centre);
  const limit = isSector ? SECTOR_RADIUS_KM : AREA_RADIUS_KM;
  return { ok: true, status: distanceKm <= limit ? "MATCHES_AREA" : "FAR_FROM_AREA", distanceKm: Math.round(distanceKm * 10) / 10 };
}

const NUM = "(-?\\d{1,3}\\.\\d{3,})";

/** Pulls coordinates out of pasted text: "23.03, 72.46", or a full Google Maps URL in its usual shapes. */
export function parseCoordinates(input: string): Point | null {
  const text = input.trim();
  const patterns = [
    new RegExp(`!3d${NUM}!4d${NUM}`),
    new RegExp(`@${NUM},${NUM}`),
    new RegExp(`[?&](?:q|ll|query|destination|center)=${NUM}(?:,|%2C)\\s*${NUM}`, "i"),
    new RegExp(`^${NUM}\\s*[,\\s]\\s*${NUM}$`),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const p = { lat: Number(m[1]), lng: Number(m[2]) };
      if (Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180) return p;
    }
  }
  return null;
}

/** Grid snapped to 0.01 degrees (about 1 km), at the cell centre. Shown publicly instead of the real point. */
export function approximate(p: Point): Point {
  const snap = (v: number) => Math.floor(v * 100) / 100 + 0.005;
  return { lat: Math.round(snap(p.lat) * 1000) / 1000, lng: Math.round(snap(p.lng) * 1000) / 1000 };
}

const at = (p: Point) => `${p.lat},${p.lng}`;

/** Opens Google Maps in the app or browser. No API key, no cost. */
export const mapsOpenUrl = (p: Point) => `https://www.google.com/maps/search/?api=1&query=${at(p)}`;

/** Search for something near a point, for example "police station". The visitor sees live Google results. */
export const mapsNearbyUrl = (what: string, p: Point) =>
  `https://www.google.com/maps/search/${encodeURIComponent(what)}/@${at(p)},15z`;

/** Embedded map. Uses the free official Embed API when a key is set, otherwise the keyless embed. */
export function mapsEmbedUrl(p: Point, zoom: number, key?: string): string {
  if (key) return `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${at(p)}&zoom=${zoom}`;
  return `https://maps.google.com/maps?q=${at(p)}&z=${zoom}&output=embed`;
}

/** Rough centre of a named area, for development previews and nearby searches. Undefined for unknown areas. */
export function areaCentre(area: string): Point | undefined {
  return /^Sector \d+$/.test(area) ? GANDHINAGAR_CENTRE : AREA_CENTRES[area];
}
