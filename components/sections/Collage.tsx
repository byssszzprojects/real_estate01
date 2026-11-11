"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { galleryItems } from "@/lib/gallery";
import { Photo } from "@/components/site/Photo";
import { ArrowRight } from "@/components/site/Icons";

type Scatter = {
  left: string;
  top: string;
  width: string;
  rotate: number;
  offset: number;
  className?: string;
};

/** Seven prints, each within -8deg..+8deg of upright. */
const scattered: Scatter[] = [
  { left: "1%", top: "8%", width: "24%", rotate: -8, offset: 1 },
  { left: "33%", top: "0%", width: "17%", rotate: 6, offset: 2, className: "hidden sm:block" },
  { left: "66%", top: "6%", width: "25%", rotate: 8, offset: 3 },
  { left: "0%", top: "44%", width: "20%", rotate: -6, offset: 4, className: "hidden lg:block" },
  { left: "78%", top: "42%", width: "21%", rotate: 5, offset: 5 },
  { left: "6%", top: "74%", width: "19%", rotate: -4, offset: 6 },
  { left: "69%", top: "72%", width: "25%", rotate: 7, offset: 7 },
];

/**
 * "A quieter way to live": prints scattered around the carousel. Scrolling
 * pulls them into the centre as the carousel opens to its final size; the
 * arrows wipe one residence into the next.
 */
export function Collage() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const busy = useRef(false);

  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);

  const go = useCallback(
    (direction: number) => {
      if (busy.current) return;
      busy.current = true;
      setPrevious(index);
      setIndex(
        (current) =>
          (current + direction + galleryItems.length) % galleryItems.length,
      );
    },
    [index],
  );

  useEffect(() => {
    const stage = stageRef.current;
    const main = mainRef.current;
    const heading = headingRef.current;
    if (!stage || !main || !heading) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

    const context = gsap.context(() => {
      gsap.set(main, { xPercent: -50, yPercent: -50, scale: 0.62 });
      gsap.set(main, { rotate: 0 });

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: stage,
          start: "top 80%",
          end: "top 15%",
          scrub: 1,
          invalidateOnRefresh: true,
          onRefreshInit: () => {
            gsap.set(cards, {
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1,
              rotation: (cardIndex) => scattered[cardIndex]?.rotate ?? 0,
            });
            gsap.set(main, { xPercent: -50, yPercent: -50, scale: 0.62 });
          },
        },
      });

      const stageRect = stage.getBoundingClientRect();
      const centreX = stageRect.width / 2;
      const centreY = stageRect.height / 2;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cardX = rect.left - stageRect.left + rect.width / 2;
        const cardY = rect.top - stageRect.top + rect.height / 2;
        timeline.to(
          card,
          {
            x: centreX - cardX,
            y: centreY - cardY,
            rotation: 0,
            scale: 0.9,
            opacity: 0,
          },
          0,
        );
      });

      timeline
        .to(heading, { opacity: 0.4, y: -40 }, 0)
        .to(main, { scale: 1 }, 0);
    }, sectionRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (previous === null) return;

    const incoming = layerRef.current;
    const outgoing = outRef.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!incoming || reduced) {
      setPrevious(null);
      busy.current = false;
      return;
    }

    const tween = gsap
      .timeline({
        onComplete: () => {
          setPrevious(null);
          busy.current = false;
        },
      })
      .fromTo(
        incoming,
        { clipPath: "inset(0% 0% 0% 100%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 0.5,
          ease: "expo.out",
        },
        0,
      )
      .to(
        outgoing,
        { xPercent: -15, opacity: 0.6, duration: 0.5, ease: "expo.out" },
        0,
      );

    return () => {
      tween.kill();
      busy.current = false;
    };
  }, [index, previous]);

  const current = galleryItems[index];
  const outgoing = previous === null ? null : galleryItems[previous];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--cream)] py-16 text-[var(--ink)] md:py-24"
    >
      <h2
        ref={headingRef}
        className="mx-auto max-w-[16ch] px-4 text-center font-serif text-[47px] font-normal leading-[0.94] tracking-[-0.01em] text-balance md:text-[90px]"
      >
        A quieter way to live
      </h2>

      <div
        ref={stageRef}
        className="relative mx-auto mt-10 h-[420px] w-full max-w-[1440px] sm:h-[520px] lg:mt-14 lg:h-[600px]"
      >
        {scattered.map((card, cardIndex) => (
          <div
            key={cardIndex}
            ref={(node) => {
              cardRefs.current[cardIndex] = node;
            }}
            aria-hidden="true"
            className={`collage-card absolute overflow-hidden ${card.className ?? ""}`}
            style={{
              left: card.left,
              top: card.top,
              width: card.width,
              rotate: `${card.rotate}deg`,
              zIndex: 10,
            }}
          >
            <Photo
              name={galleryItems[(index + card.offset) % galleryItems.length].name}
              alt=""
              sizes="(min-width: 1024px) 26vw, 50vw"
              className="aspect-[16/10] w-full object-cover"
            />
          </div>
        ))}

        <div
          ref={mainRef}
          className="absolute left-1/2 top-[42%] z-20 w-[88%] sm:w-[80%] lg:w-[min(1000px,70vw)]"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <div className="collage-main relative overflow-hidden">
            {outgoing && (
              <div key={previous} ref={outRef} className="absolute inset-0">
                <Photo
                  name={outgoing.name}
                  alt=""
                  sizes="(min-width: 1024px) 70vw, 88vw"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div ref={layerRef} className="relative">
              <Photo
                key={current.name}
                name={current.name}
                alt={current.alt}
                sizes="(min-width: 1024px) 70vw, 88vw"
                className="aspect-[1000/460] w-full object-cover"
              />
            </div>
          </div>

          <div className="absolute inset-x-0 -bottom-6 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="collage-arrow inline-flex h-12 w-12 items-center justify-center bg-[var(--cream)] text-[var(--ink)] transition-colors duration-300 ease-[var(--ease-std)] hover:bg-[var(--white)]"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span className="sr-only">Previous residence</span>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="collage-arrow inline-flex h-12 w-12 items-center justify-center bg-[var(--cream)] text-[var(--ink)] transition-colors duration-300 ease-[var(--ease-std)] hover:bg-[var(--white)]"
            >
              <ArrowRight className="h-4 w-4" />
              <span className="sr-only">Next residence</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container-wide mt-16 flex items-center justify-between gap-4 border-t border-[var(--ink)]/15 pt-4">
        <p className="type-label-sm" aria-live="polite">
          {current.caption}
        </p>
        <p className="type-label-sm tabular-nums">
          {String(index + 1).padStart(2, "0")} / {galleryItems.length}
        </p>
      </div>
    </section>
  );
}
