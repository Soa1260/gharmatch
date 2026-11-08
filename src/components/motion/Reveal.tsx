"use client";

import * as m from "motion/react-m";
import { container, fadeUp, viewportOnce } from "@/lib/motion";

export function Reveal({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "li" }) {
  const Tag = m[as];
  return (
    <Tag className={className} variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}>
      {children}
    </Tag>
  );
}

/** Children using `Item` animate in one after another when the group scrolls into view. */
export function Stagger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={container} initial="hidden" whileInView="show" viewport={viewportOnce}>
      {children}
    </m.div>
  );
}

export function Item({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={fadeUp}>
      {children}
    </m.div>
  );
}
