"use client";

import { useState } from "react";
import { mapsEmbedUrl, mapsNearbyUrl, mapsOpenUrl, type Point } from "@/lib/location";

const NEAR = [
  ["Police station", "police station"],
  ["Hospital", "hospital"],
  ["Pharmacy", "pharmacy"],
  ["Bus stop", "bus stop"],
  ["Metro", "metro station"],
] as const;

/**
 * The map for a listing. It shows an approximate area (about 1 km), never the exact home. The embedded map
 * loads only after a tap, so visitors who do not need it never contact Google. The nearby links open live
 * Google Maps searches, so we do not state facts about a neighbourhood that we cannot check.
 */
export function MapSection({
  approx,
  area,
  locationStatus,
  checkedAt,
  embedKey,
}: {
  approx: Point | null;
  area: string;
  locationStatus: string;
  checkedAt: string | null;
  embedKey?: string;
}) {
  const [show, setShow] = useState(false);

  if (!approx) {
    return (
      <section className="rounded-2xl border border-line p-6">
        <h2 className="index">Location</h2>
        <p className="mt-3 text-sm text-soft">The landlord has not added a map location for this home.</p>
      </section>
    );
  }

  const statusText =
    locationStatus === "MATCHES_AREA"
      ? `The pin sits inside ${area}${checkedAt ? ` (checked ${checkedAt})` : ""}. That shows the point is in the right part of the city. It does not show who owns the home.`
      : "The pin has not been checked against the area.";

  return (
    <section aria-labelledby="location" className="rounded-2xl border border-line p-6">
      <h2 id="location" className="index">Location</h2>
      <p className="mt-3 text-sm text-soft">{statusText}</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {show ? (
          <iframe
            title={`Map of the area around ${area}`}
            src={mapsEmbedUrl(approx, 14, embedKey)}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-64 w-full sm:h-80"
          />
        ) : (
          <button type="button" onClick={() => setShow(true)} className="grid h-40 w-full place-items-center text-sm text-soft transition-colors hover:text-text">
            Show map of the area
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-faint">Approximate area, within about 1 km. The exact address is shared after the landlord accepts your interest.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={mapsOpenUrl(approx)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-full bg-text px-4 text-sm font-medium text-void">
          Open in Google Maps
        </a>
        {NEAR.map(([name, query]) => (
          <a key={name} href={mapsNearbyUrl(query, approx)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center rounded-full border border-line px-4 text-sm text-soft transition-colors hover:border-line-strong hover:text-text">
            {name} nearby
          </a>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-faint">
        These links open live Google Maps searches around the area. We do not rate a neighbourhood as safe or unsafe. Check the route, the lighting and the time of day yourself, and tell someone you trust.
      </p>
    </section>
  );
}
