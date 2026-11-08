"use client";

import { m, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

/** Hero artwork: a dark planet edge lit by a warm lamp, drifting slowly as the page scrolls. */
export function Horizon() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const glow = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <m.div style={{ y, opacity: glow }} className="absolute inset-x-0 bottom-0 h-[70%]">
        <div
          className="absolute left-1/2 top-[62%] h-[160%] w-[170%] -translate-x-1/2 rounded-[50%]"
          style={{
            background: "radial-gradient(closest-side, #05060a 97%, transparent 100%)",
            boxShadow:
              "0 -2px 0 0 rgba(240,181,110,0.55), 0 -18px 60px 0 rgba(240,181,110,0.28), 0 -80px 160px 20px rgba(185,114,44,0.18), 0 -160px 280px 40px rgba(42,58,140,0.18)",
          }}
        />
      </m.div>
      <div className="grain absolute inset-0" />
    </div>
  );
}
