"use client";

import { m, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { fadeUp, spring, viewportOnce } from "@/lib/motion";

const steps = [
  { n: "01", title: "Say what you need", body: "Budget, areas, move-in date, food, pets, smoking. Landlords write their house rules the same way." },
  { n: "02", title: "See the fit first", body: "Every home shows a score and plain reasons. A rule that cannot work is shown before you write a word." },
  { n: "03", title: "Express interest", body: "A short message. No phone numbers or links allowed in it, so nobody is chased." },
  { n: "04", title: "Contacts open on accept", body: "Only when the other side accepts do both of you see phone and email. Not before, not for anyone else." },
];

/** A line draws down the page as the visitor scrolls, lighting each step in turn. */
export function Steps() {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, spring.smooth);
  const height = useTransform(scaleY, [0, 1], ["0%", "100%"]);

  return (
    <ol ref={ref} className="relative space-y-14 pl-10 md:pl-16">
      <span aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-line md:left-[15px]" />
      <m.span aria-hidden style={{ height }} className="absolute left-[7px] top-2 w-px bg-lamp md:left-[15px]" />
      {steps.map((s) => (
        <m.li key={s.n} variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce} className="relative">
          <span className="absolute -left-10 top-1.5 size-[15px] rounded-full border border-line-strong bg-void md:-left-16 md:size-[31px]" />
          <p className="text-xs tracking-[0.16em] text-lamp">{s.n}</p>
          <h3 className="mt-2 text-2xl font-light tracking-tight md:text-3xl">{s.title}</h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-soft">{s.body}</p>
        </m.li>
      ))}
    </ol>
  );
}
