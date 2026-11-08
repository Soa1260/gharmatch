"use client";

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

/** Loads only the DOM animation features and respects the visitor's reduced-motion setting. */
export function MotionRoot({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
