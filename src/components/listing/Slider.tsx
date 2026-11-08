"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/art/CoverArt";

interface SliderProps {
  /** Photo URLs. When empty, generated cover art is shown instead. */
  images: string[];
  seed: string;
  title: string;
  /** Number of art slides to show when there are no photos. Used only for development previews. */
  artSlides?: number;
  /** When set, each slide links here, so tapping the picture opens the listing. Swiping does not. */
  href?: string;
  className?: string;
}

/**
 * Swipeable image strip. Uses native scroll-snap, so touch swipe, trackpad and keyboard scrolling all
 * work with no library. Arrows and dots are extras on top of that.
 */
export function Slider({ images, seed, title, artSlides = 1, href, className = "" }: SliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = images.length > 0 ? images.length : artSlides;
  const many = slides > 1;

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setIndex(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onScroll);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => {
      el.removeEventListener("scroll", handler);
      cancelAnimationFrame(raf);
    };
  }, [onScroll]);

  const go = (to: number) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(slides - 1, to));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-void/70 text-sm text-text backdrop-blur transition-opacity hover:bg-void focus-visible:opacity-100 disabled:hidden sm:opacity-0 sm:group-hover/slider:opacity-100";

  return (
    <div className={`group/slider ${className}`}>
      <div
        ref={track}
        role="group"
        aria-roledescription="carousel"
        aria-label={`Photos of ${title}`}
        className="flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {Array.from({ length: slides }, (_, i) => {
          const picture =
            images.length > 0 ? (
              // Plain img on purpose: files are already shrunk before upload, so the image optimizer is not needed.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[i]}
                alt={i === 0 ? title : `${title}, photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="size-full object-cover"
              />
            ) : (
              <CoverArt seed={`${seed}${i === 0 ? "" : `-${i}`}`} className="size-full" />
            );
          return (
            <div key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides}`} className="relative size-full shrink-0 basis-full snap-center">
              {href ? (
                <Link href={href} tabIndex={-1} aria-hidden className="block size-full">
                  {picture}
                </Link>
              ) : (
                picture
              )}
            </div>
          );
        })}
      </div>

      {many ? (
        <>
          <button type="button" aria-label="Previous photo" disabled={index === 0} onClick={() => go(index - 1)} className={`${arrow} left-2`}>
            ‹
          </button>
          <button type="button" aria-label="Next photo" disabled={index === slides - 1} onClick={() => go(index + 1)} className={`${arrow} right-2`}>
            ›
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5" aria-hidden>
            {Array.from({ length: slides }, (_, i) => (
              <span key={i} className={`h-1.5 rounded-full bg-text transition-all duration-300 ${i === index ? "w-4 opacity-100" : "w-1.5 opacity-50"}`} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
