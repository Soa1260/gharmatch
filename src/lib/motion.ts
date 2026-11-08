import type { Transition, Variants } from "motion/react";

/**
 * The motion script. Every animation on the site picks from these values.
 * See docs/MOTION.md for when to use which.
 */
export const ease = {
  out: [0.22, 1, 0.36, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

export const duration = {
  quick: 0.18,
  base: 0.45,
  slow: 0.9,
} as const;

export const spring = {
  /** Controls that follow the pointer: chips, toggles, magnetic buttons. */
  snappy: { type: "spring", stiffness: 420, damping: 32, mass: 0.7 } satisfies Transition,
  /** Panels, sheets and layout changes. */
  smooth: { type: "spring", stiffness: 220, damping: 30, mass: 0.9 } satisfies Transition,
} as const;

export const stagger = 0.07;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: duration.base, ease: ease.out } },
};

export const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
};

export const sheet: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring.smooth },
  exit: { opacity: 0, y: 12, scale: 0.98, transition: { duration: duration.quick, ease: ease.inOut } },
};

export const viewportOnce = { once: true, margin: "-12% 0px -12% 0px" } as const;
