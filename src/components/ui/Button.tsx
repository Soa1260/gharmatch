"use client";

import * as m from "motion/react-m";
import { useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { spring } from "@/lib/motion";

type Variant = "solid" | "ghost";

const base =
  "relative inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium tracking-tight whitespace-nowrap transition-colors";
const variants: Record<Variant, string> = {
  solid: "bg-text text-void hover:bg-white",
  ghost: "border border-line-strong text-text hover:border-soft hover:bg-raised",
};

/** Pill button that leans a few pixels toward the pointer. Disabled on touch and reduced motion by MotionConfig. */
export function Button({ href, variant = "solid", children, className = "" }: { href: string; variant?: Variant; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), spring.snappy);
  const y = useSpring(useMotionValue(0), spring.snappy);

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.12);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.2);
  }
  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <m.span ref={ref} style={{ x, y }} onPointerMove={onMove} onPointerLeave={onLeave} className="inline-block" whileTap={{ scale: 0.97 }}>
      <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
        {children}
      </Link>
    </m.span>
  );
}
