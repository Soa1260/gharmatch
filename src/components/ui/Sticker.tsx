"use client";

import { m } from "motion/react";
import { spring } from "@/lib/motion";

const tones = {
  lamp: "bg-lamp text-void",
  lime: "bg-lime text-void",
  blush: "bg-blush text-void",
  paper: "bg-text text-void",
} as const;

/**
 * A tag you can pick up and move. Each one is a real house rule, so the hero is a small
 * demonstration of the product: rules are things you place, not boxes you tick.
 */
export function Sticker({
  children,
  tone = "paper",
  rotate = 0,
  constraints,
  className = "",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  rotate?: number;
  constraints?: React.RefObject<HTMLElement | null>;
  className?: string;
}) {
  return (
    <m.div
      drag
      dragConstraints={constraints}
      dragElastic={0.12}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.7, rotate: rotate - 14 }}
      animate={{ opacity: 1, scale: 1, rotate, transition: spring.snappy }}
      whileHover={{ scale: 1.06, rotate: rotate + 2 }}
      whileDrag={{ scale: 1.1, rotate: rotate - 3, cursor: "grabbing", zIndex: 30 }}
      className={`w-fit cursor-grab select-none rounded-lg px-4 py-2 font-mono text-[13px] font-medium uppercase tracking-wide shadow-[0_2px_0_rgba(0,0,0,0.5)] ${tones[tone]} ${className}`}
    >
      {children}
    </m.div>
  );
}
