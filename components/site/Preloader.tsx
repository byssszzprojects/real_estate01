"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { lockScroll, unlockScroll } from "@/lib/scroll-control";

/**
 * The opening frame runs once per browser session. Add ?preloader=1 to force
 * the full sequence for a review or a recording.
 */
const PRELOADER_SESSION_KEY = "zara:preloader-seen";

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const content = contentRef.current;
    const progress = progressRef.current;
    if (!root || !content || !progress) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const heroItems = Array.from(
      document.querySelectorAll<HTMLElement>(".hero-intro"),
    );
    const counter = { value: 0 };
    let ready = false;
    let done = false;

    const forcePreloader =
      new URLSearchParams(window.location.search).get("preloader") === "1";
    let seen = false;
    try {
      seen = sessionStorage.getItem(PRELOADER_SESSION_KEY) === "1";
    } catch {
      seen = false;
    }

    if (seen && !forcePreloader) {
      document.documentElement.classList.remove("motion-pending");
      document.documentElement.classList.add("motion-gsap");
      document.documentElement.dataset.motionReady = "true";
      gsap.set(heroItems, { opacity: 1, y: 0 });
      setGone(true);
      window.dispatchEvent(new Event("zara:preloader-done"));
      return;
    }

    lockScroll();
    if (!window.location.hash) window.scrollTo(0, 0);
    document.documentElement.classList.add("motion-pending");

    const finish = () => {
      if (ready) return;
      ready = true;

      // Only mark the session once the sequence has actually played. Writing
      // this on mount meant a remount (React strict mode in development) found
      // the flag set by the first, already-cancelled pass and skipped the
      // opening frame, and with it the hero entrance, on every load.
      try {
        sessionStorage.setItem(PRELOADER_SESSION_KEY, "1");
      } catch {
        // Private browsing can disable storage; the sequence still runs once.
      }

      gsap.set(heroItems, reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 });
      document.documentElement.classList.remove("motion-pending");
      document.documentElement.classList.add("motion-gsap");
      document.documentElement.dataset.motionReady = "true";
      unlockScroll();
      window.dispatchEvent(new Event("zara:preloader-done"));

      if (!reduced) {
        gsap.to(heroItems, {
          opacity: 1,
          y: 0,
          duration: 1.05,
          stagger: 0.075,
          delay: 0.2,
          ease: "expo.out",
        });
      }
    };

    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.to(
      counter,
      {
        value: 100,
        duration: reduced ? 0.45 : 2.05,
        ease: "power2.inOut",
        onUpdate: () => setCount(Math.round(counter.value)),
      },
      0,
    )
      .fromTo(
        progress,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: reduced ? 0.45 : 2.05,
          ease: "power2.inOut",
        },
        0,
      )
      .to(
        content,
        {
          yPercent: -7,
          opacity: 0,
          duration: reduced ? 0.15 : 0.45,
          ease: "power2.in",
        },
        reduced ? 0.6 : 2.05,
      )
      .call(finish, undefined, reduced ? 0.7 : 2.35)
      .to(
        root,
        {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: reduced ? 0.22 : 0.95,
          ease: "expo.inOut",
        },
        reduced ? 0.7 : 2.35,
      )
      .call(
        () => {
          done = true;
          setGone(true);
        },
        undefined,
        reduced ? 1.05 : 3.4,
      );

    return () => {
      tl.kill();
      unlockScroll();
      if (!done) {
        document.documentElement.classList.remove("motion-pending");
        gsap.set(heroItems, { opacity: 1, y: 0 });
      }
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      data-preloader
      role="status"
      aria-label="Loading ZARA"
      className="preloader fixed inset-0 z-[200] flex min-h-[100svh] flex-col justify-between bg-[#1a1a1a] p-6 text-[#ede6d6] md:p-10 lg:p-12"
    >
      <div className="flex items-start justify-between gap-6">
        <p className="type-micro text-[#ede6d6]/45">
          Contemporary architecture &amp; residences
        </p>
        <p className="type-micro text-[#ede6d6]/45">Assagao · Goa</p>
      </div>

      <div ref={contentRef} className="flex flex-1 flex-col justify-end pb-8 md:pb-12">
        <div className="flex items-end justify-between gap-8">
          <div>
            <p className="font-sans text-[clamp(1.8rem,3.5vw,3.7rem)] font-semibold uppercase leading-[0.9] tracking-[-0.06em]">
              ZARA
            </p>
            <p className="mt-4 max-w-[280px] font-serif text-[clamp(1.2rem,1.8vw,1.6rem)] leading-[1.1] text-[#ede6d6]/60">
              A quieter way to arrive.
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="type-micro text-[#ede6d6]/50">
              Private residence tour
            </p>
            <p className="mt-2 font-sans text-[clamp(2.8rem,6vw,5.6rem)] font-medium leading-none tracking-[-0.07em] tabular-nums">
              {String(count).padStart(3, "0")}
            </p>
          </div>
        </div>
      </div>

      <div>
        <div className="relative h-px w-full bg-[#ede6d6]/20">
          <div
            ref={progressRef}
            className="absolute inset-0 origin-left bg-[#ede6d6]"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
        <div className="mt-4 flex items-center justify-between gap-6">
          <p className="type-micro text-[#ede6d6]/45">
            Preparing the residences
          </p>
          <p className="type-micro text-[#ede6d6]/45">Est. 2014</p>
        </div>
      </div>
    </div>
  );
}
