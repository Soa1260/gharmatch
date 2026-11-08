"use client";

import { animate, m, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";
import { ease } from "@/lib/motion";

/** Compatibility score as a ring that draws itself and counts up once visible. */
export function MatchRing({ score, size = 96, label = true }: { score: number; size?: number; label?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const value = useMotionValue(0);
  const text = useTransform(value, (v) => Math.round(v).toString());
  const dash = useTransform(value, (v) => v / 100);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, score, { duration: 1.1, ease: ease.out });
    return () => controls.stop();
  }, [inView, score, value]);

  const stroke = 5;
  const r = (size - stroke) / 2;
  const tone = score >= 70 ? "var(--color-lamp)" : score >= 40 ? "var(--color-soft)" : "var(--color-danger)";

  return (
    <div ref={ref} className="relative inline-grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={`Compatibility ${score} out of 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
        <m.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round" style={{ pathLength: dash }} />
      </svg>
      <div className="absolute text-center leading-none">
        <m.span className="text-2xl font-light tracking-tight">{text}</m.span>
        {label ? <span className="mt-1 block text-[10px] uppercase tracking-[0.14em] text-faint">match</span> : null}
      </div>
    </div>
  );
}
