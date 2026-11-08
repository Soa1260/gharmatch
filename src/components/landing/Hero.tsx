"use client";

import { LazyMotion, m } from "motion/react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Sticker } from "@/components/ui/Sticker";
import { container, fadeUp } from "@/lib/motion";

export function Hero() {
  const stage = useRef<HTMLElement>(null);

  return (
    <section ref={stage} className="relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-36 md:min-h-[88svh] md:grid-cols-[1.35fr_1fr] md:items-end md:pb-28">
        <m.div variants={container} initial="hidden" animate="show">
          <m.p variants={fadeUp} className="index">
            ઘર · Ahmedabad + Gandhinagar
          </m.p>
          <m.h1 variants={fadeUp} className="display mt-6 text-[clamp(3rem,9.5vw,8.25rem)]">
            Find a flat
            <br />
            that gets
            <br />
            <span className="text-lamp">how you live.</span>
          </m.h1>
          <m.p variants={fadeUp} className="mt-8 max-w-md text-[17px] leading-relaxed text-soft">
            Landlords post their house rules. You post yours. We show who fits, and phone numbers open only after a yes. Broker nahi, bas rules.
          </m.p>
          <m.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <Button href="/listings">Browse homes</Button>
            <Button href="/listings/new" variant="ghost">I have a flat to rent</Button>
          </m.div>
        </m.div>

        <LazyMotion features={() => import("@/components/motion/dragFeatures").then((mod) => mod.default)} strict>
        <div className="relative flex min-h-64 flex-wrap content-start gap-3 md:min-h-[26rem] md:block" aria-label="House rules you can move around">
          <p className="index mb-2 md:absolute md:left-0 md:top-0">Drag these around</p>
          <Sticker constraints={stage} tone="paper" rotate={-5} className="md:absolute md:left-2 md:top-12">Veg only</Sticker>
          <Sticker constraints={stage} tone="lamp" rotate={4} className="md:absolute md:left-40 md:top-24">No smoking</Sticker>
          <Sticker constraints={stage} tone="lime" rotate={-3} className="md:absolute md:left-4 md:top-44">Pets: ask first</Sticker>
          <Sticker constraints={stage} tone="blush" rotate={6} className="md:absolute md:left-44 md:top-60">11 month lease</Sticker>
          <Sticker constraints={stage} tone="paper" rotate={-7} className="md:absolute md:left-8 md:top-80">Bachelors ok</Sticker>
          <Sticker constraints={stage} tone="lime" rotate={3} className="md:absolute md:left-48 md:top-[22rem]">Visitors till 9</Sticker>
        </div>
        </LazyMotion>
      </div>
    </section>
  );
}
