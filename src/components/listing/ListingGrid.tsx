"use client";

import { m } from "motion/react";
import { container } from "@/lib/motion";
import { ListingCard, type ListingCardData } from "./ListingCard";

/** `key` should change with the filters so the cards re-enter in sequence. */
export function ListingGrid({ items, sample }: { items: ListingCardData[]; sample: boolean }) {
  return (
    <m.ul variants={container} initial="hidden" animate="show" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((l) => (
        <ListingCard key={l.slug} listing={l} sample={sample} />
      ))}
    </m.ul>
  );
}
