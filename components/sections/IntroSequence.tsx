"use client";

import { Fragment, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { Photo } from "@/components/site/Photo";
import { ArrowRight, ArrowUpRight } from "@/components/site/Icons";

const STATEMENT =
  "We create residences where architecture, light, and material come together to shape a quieter way of living.";
const WORDS = STATEMENT.split(" ");

/**
 * Home section and the sequence out of it:
 *   1. full-bleed residence photograph, "Space, Considered." and the
 *      featured-residence bar from the reference page
 *   2. on scroll the photograph wipes through two more frames and travels
 *      into the About headline, becoming its inline thumbnail
 *   3. the headline words rise out of their masks once the print has cleared
 */
export function IntroSequence() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const slotRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const frame = frameRef.current;
    const slot = slotRef.current;
    const headline = headlineRef.current;
    if (!root || !stage || !frame || !slot || !headline) return;

    const words = Array.from(
      headline.querySelectorAll<HTMLElement>(".intro-word"),
    );

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      gsap.set([aboutRef.current, ruleRef.current, metaRef.current], {
        opacity: 1,
        scaleX: 1,
        y: 0,
      });
      gsap.set(slot, { opacity: 1 });
      gsap.set(words, { yPercent: 0 });
      gsap.set(heroRef.current, { opacity: 0 });
      return;
    }

    const context = gsap.context(() => {
      const travel = () => {
        const stageRect = stage.getBoundingClientRect();
        const slotRect = slot.getBoundingClientRect();
        const width = stageRect.width || 1;
        const height = stageRect.height || 1;

        return {
          x:
            slotRect.left +
            slotRect.width / 2 -
            (stageRect.left + stageRect.width / 2),
          y:
            slotRect.top +
            slotRect.height / 2 -
            (stageRect.top + stageRect.height / 2),
          sx: (slotRect.width || 125) / width,
          sy: (slotRect.height || 60) / height,
        };
      };

      const timeline = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "+=260%",
          scrub: 1,
          pin: stage,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(heroRef.current, { opacity: 0, y: -24, duration: 1.4 }, 0)
        .to(aboutRef.current, { opacity: 1, duration: 0.6 }, 2.6)
        .to(
          layerRefs.current[1],
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6 },
          3.8,
        )
        .to(
          layerRefs.current[2],
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.6 },
          5.2,
        )
        .to(
          frame,
          {
            x: () => travel().x,
            y: () => travel().y,
            scaleX: () => travel().sx,
            scaleY: () => travel().sy,
            borderRadius: 8,
            duration: 2,
          },
          6.0,
        )
        .to(frame, { opacity: 0, duration: 0.3 }, 8.0)
        .to(slot, { opacity: 1, duration: 0.2 }, 8.1)
        .from(
          words,
          {
            yPercent: 100,
            duration: 1.15,
            stagger: 0.02,
            ease: "expo.out",
          },
          8.2,
        )
        .to(ruleRef.current, { scaleX: 1, duration: 1, ease: "expo.out" }, 9.0)
        .to(
          metaRef.current,
          { opacity: 1, y: 0, duration: 1, ease: "expo.out" },
          9.2,
        );
    }, rootRef);

    ScrollTrigger.refresh();

    return () => context.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      className="intro relative bg-[var(--cream)] text-[var(--ink)]"
    >
      <div
        ref={stageRef}
        className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden"
      >
        {/* The home photograph, and the frames it wipes through. */}
        <div ref={frameRef} className="intro-frame absolute inset-0 z-20">
          <Photo
            name="nightSide"
            alt="A contemporary stone residence at dusk, lit from within."
            sizes="100vw"
            priority
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            ref={(node) => {
              layerRefs.current[1] = node;
            }}
            className="absolute inset-0"
            style={{ clipPath: "inset(0% 0% 0% 100%)" }}
          >
            <Photo
              name="apartment-living"
              alt=""
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div
            ref={(node) => {
              layerRefs.current[2] = node;
            }}
            className="absolute inset-0"
            style={{ clipPath: "inset(0% 0% 0% 100%)" }}
          >
            <Photo
              name="hero3"
              alt=""
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          </div>
          <div aria-hidden="true" className="hero-scrim absolute inset-0" />
        </div>

        {/* Home copy over the photograph. */}
        <div ref={heroRef} className="absolute inset-0 z-30 flex flex-col">
          <div className="container-wide flex flex-1 flex-col justify-center pt-20">
            <h1 className="max-w-[12ch] font-serif text-[clamp(3rem,6.3vw,5.64rem)] font-normal leading-[0.94] tracking-[-0.015em] text-[var(--white)]">
              Space,
              <br />
              <span className="italic">Considered.</span>
            </h1>

            <div className="mt-7 flex flex-wrap gap-x-10 gap-y-3">
              <a
                href="#residences"
                className="inline-flex items-center gap-3 border-b border-white/60 pb-1 text-[11px] uppercase tracking-[0.16em] text-[var(--white)] transition-opacity duration-300 ease-[var(--ease-std)] hover:opacity-70"
              >
                Explore residence
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="#tour"
                className="inline-flex items-center gap-3 border-b border-white/60 pb-1 text-[11px] uppercase tracking-[0.16em] text-[var(--white)] transition-opacity duration-300 ease-[var(--ease-std)] hover:opacity-70"
              >
                Experience the space
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="container-wide pb-8">
            <div className="grid grid-cols-2 gap-4 border-t border-white/25 py-4 text-[var(--white)]/80 sm:grid-cols-4">
              <span className="type-label-sm">Featured residence</span>
              <span className="type-label-sm">Private residence</span>
              <span className="type-label-sm">2026</span>
              <span className="type-label-sm sm:text-right">Explore</span>
            </div>
            <p className="mt-3 text-center font-serif text-[clamp(1rem,1.6vw,1.35rem)] italic leading-[1.35] text-[var(--white)]/90">
              A residence is more than its form.
              <br />
              It is how light moves through it.
            </p>
          </div>
        </div>

        {/* About, revealed beneath the travelling photograph. */}
        <div
          ref={aboutRef}
          className="absolute inset-0 z-10 flex items-center opacity-0"
        >
          <div className="container-wide w-full">
            <div className="grid gap-5 md:grid-cols-12">
              <p className="type-label-sm text-[var(--ink)]/70 md:col-span-2 md:pt-2">
                About
              </p>

              <div className="md:col-span-10">
                <h2
                  ref={headlineRef}
                  data-split="manual"
                  className="intro-headline"
                >
                  <span ref={slotRef} className="intro-slot" aria-hidden="true">
                    <Photo
                      name="hero3"
                      alt=""
                      sizes="160px"
                      className="h-full w-full object-cover"
                    />
                  </span>{" "}
                  {WORDS.map((word, wordIndex) => (
                    <Fragment key={`${word}-${wordIndex}`}>
                      <span className="intro-word-mask">
                        <span className="intro-word">{word}</span>
                      </span>
                      {wordIndex < WORDS.length - 1 ? " " : null}
                    </Fragment>
                  ))}
                </h2>

                <span
                  ref={ruleRef}
                  aria-hidden="true"
                  className="mt-8 block h-px origin-left scale-x-0 bg-[var(--ink)]/20"
                />

                <div className="mt-7 grid gap-6 md:grid-cols-12">
                  <div
                    ref={metaRef}
                    className="translate-y-4 opacity-0 md:col-span-5"
                  >
                    <p className="max-w-[360px] text-[16px] leading-[1.5] text-[var(--ink)]/75">
                      ZARA is a contemporary residential experience
                      shaped around considered spaces, natural light, honest
                      materials, and the feeling of living within them.
                    </p>
                    <a
                      href="#architecture"
                      className="link-under mt-5 inline-flex text-[14px]"
                    >
                      Our approach
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>

                  <p className="type-label-sm self-start text-[var(--ink)]/60 md:col-span-3 md:col-start-10">
                    Est. 2014 · Goa
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
