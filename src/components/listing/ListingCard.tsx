"use client";

import { m } from "motion/react";
import Link from "next/link";
import { fadeUp, spring } from "@/lib/motion";
import { inr, label, pick } from "@/lib/labels";
import { Slider } from "./Slider";

export interface ListingCardData {
  slug: string;
  title: string;
  area: string;
  city: string;
  rent: number;
  bhk: number;
  furnishing: string;
  dietPolicy: string;
  genderPolicy: string;
  securityFeatures: string[];
  /** Public photo URLs, cover first. Empty means generated art is shown. */
  photos: string[];
  /** Development previews only: how many art slides to show when there are no photos. */
  artSlides?: number;
}

export function ListingCard({ listing, sample = false }: { listing: ListingCardData; sample?: boolean }) {
  const href = `/listings/${listing.slug}`;
  const chips = [
    pick(label.furnishing, listing.furnishing),
    pick(label.diet, listing.dietPolicy),
    ...(listing.genderPolicy !== "ANY" ? [pick(label.gender, listing.genderPolicy)] : []),
  ];

  return (
    <m.li variants={fadeUp} whileHover={{ y: -4 }} transition={spring.smooth} className="list-none">
      <article className="h-full overflow-hidden rounded-2xl border border-line bg-surface p-2 transition-colors hover:border-line-strong">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <Slider images={listing.photos} seed={listing.slug} title={listing.title} artSlides={listing.artSlides} href={href} className="absolute inset-0" />
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex gap-2">
            <span className="rounded-full bg-void/70 px-3 py-1 text-xs backdrop-blur">{listing.bhk} BHK</span>
            {sample ? <span className="rounded-full bg-lamp/90 px-3 py-1 text-xs font-medium text-void">Sample</span> : null}
          </div>
          {listing.securityFeatures.length > 0 ? (
            <span className="pointer-events-none absolute bottom-8 left-3 z-10 rounded-full bg-void/70 px-3 py-1 text-xs text-soft backdrop-blur">
              {listing.securityFeatures.slice(0, 2).map((f) => pick(label.security, f)).join(" · ")}
            </span>
          ) : null}
        </div>
        <Link href={href} className="block px-2 pb-2 pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-display text-lg font-semibold leading-tight tracking-tight">{listing.title}</h3>
            <p className="shrink-0 font-mono text-[15px] text-text">{inr(listing.rent)}</p>
          </div>
          <p className="mt-1 text-sm text-faint">
            {listing.area}, {listing.city === "AHMEDABAD" ? "Ahmedabad" : "Gandhinagar"}
          </p>
          <p className="mt-4 text-sm text-soft">{chips.join(" · ")}</p>
        </Link>
      </article>
    </m.li>
  );
}
