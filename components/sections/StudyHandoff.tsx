"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Photo } from "@/components/site/Photo";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const HANDOFF_EVENT = "zara:study-handoff";

/**
 * The full-bleed layer that carries the print out of FullView. It is rendered
 * through a portal on document.body so the page-wide motion system (which only
 * scans `main img`) never picks it up. It stays inert and unhittable until the
 * zoom starts, and goes inert again as soon as the handoff finishes.
 */
function Overlay() {
  return (
    <div
      data-study-overlay
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
      style={{ visibility: "hidden", opacity: 0 }}
    >
      <Photo
        name="hero5"
        alt=""
        sizes="100vw"
        priority
        className="h-full w-full object-cover object-[50%_100%]"
      />
    </div>
  );
}

/**
 * FullView -> FullViewStudy handoff.
 *
 * 1. The print crossfades into a full-viewport photograph that grows to 90% of
 *    the viewport (cream margin, 6px -> 0 radius) while the marquee drops to
 *    25%, so only its outer letters peek past the frame.
 * 2. The photograph continues to 100vw x 100vh, the marquee reaches 0 and the
 *    header switches to white ink. The pin then holds that frame as a beat.
 * 3. The photograph scales 1 -> 1.08 and fades out while the study's canvas
 *    fades in and its camera dollies forward.
 *
 * Transform, opacity and clip-path only, so nothing reflows.
 */
export function StudyHandoff() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const overlay = document.querySelector<HTMLElement>("[data-study-overlay]");
    const print = document.querySelector<HTMLElement>("[data-study-print]");
    const box = document.querySelector<HTMLElement>("[data-study-print-box]");
    const marquee = document.querySelector<HTMLElement>("[data-study-marquee]");
    const stage = document.querySelector<HTMLElement>("[data-study-stage]");
    const canvas = document.querySelector<HTMLElement>("[data-study-canvas]");
    const study = document.querySelector<HTMLElement>("#full-view");

    if (!overlay || !print || !box || !marquee || !stage || !canvas || !study) {
      return;
    }

    const html = document.documentElement;
    const setHeroDark = (on: boolean) => {
      if (on) html.dataset.zaraHeroDark = "true";
      else delete html.dataset.zaraHeroDark;
    };
    const emit = (progress: number) => {
      window.dispatchEvent(
        new CustomEvent(HANDOFF_EVENT, { detail: { progress } }),
      );
    };

    setHeroDark(false);
    overlay.style.visibility = "hidden";

    const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wideQuery = window.matchMedia("(min-width: 768px)");

    let teardown: (() => void) | null = null;
    let syncChrome = () => {};

    const build = () => {
      teardown?.();
      teardown = null;
      syncChrome = () => {};

      if (reducedQuery.matches) {
        // Simple crossfade only: no pin, no zoom, no dolly, no header change.
        const fade = gsap.fromTo(
          canvas,
          { opacity: 0 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: study,
              start: "top bottom",
              end: "top 55%",
              scrub: true,
            },
          },
        );

        teardown = () => {
          fade.scrollTrigger?.kill();
          gsap.set(canvas, { clearProps: "opacity" });
          emit(0);
        };
        return;
      }

      const wide = wideQuery.matches;

      const context = gsap.context(() => {
        // The overlay is scaled from the print's centre, measured relative to
        // the stage that gets pinned, so the first frame sits on the print.
        const measure = () => {
          const printRect = box.getBoundingClientRect();
          const stageRect = stage.getBoundingClientRect();
          gsap.set(overlay, {
            transformOrigin: `${Math.round(
              printRect.left - stageRect.left + printRect.width / 2,
            )}px ${Math.round(
              printRect.top - stageRect.top + printRect.height / 2,
            )}px`,
          });
        };

        measure();
        gsap.set(canvas, { opacity: 0 });

        const pin = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: stage,
            start: "top top",
            end: wide ? "+=240%" : "+=150%",
            scrub: 0.6,
            pin: stage,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: () => {
              measure();
              syncChrome();
            },
            onUpdate: () => syncChrome(),
          },
        });

        pin
          // The print hands over to the full-viewport layer, then grows.
          .to(print, { opacity: 0, duration: 0.05 }, 0)
          .fromTo(
            overlay,
            { opacity: 0 },
            { opacity: 1, duration: 0.05, immediateRender: true },
            0,
          )
          .fromTo(
            overlay,
            {
              scale: () =>
                Math.min(1, box.offsetWidth / Math.max(1, window.innerWidth)),
              clipPath: "inset(0px round 6px)",
            },
            {
              scale: 0.9,
              clipPath: "inset(0px round 0px)",
              duration: 0.3,
              immediateRender: true,
            },
            0,
          )
          .fromTo(
            marquee,
            { opacity: 1 },
            { opacity: 0.25, duration: 0.3, immediateRender: true },
            0,
          )
          // Hard full-bleed. Everything after 0.3 of the timeline is the beat.
          .to(overlay, { scale: 1, duration: 0.25 }, 0.3)
          .to(marquee, { opacity: 0, duration: 0.25 }, 0.3);

        const handoff = gsap.timeline({
          scrollTrigger: {
            trigger: study,
            start: "top bottom",
            end: "top top",
            scrub: 0.6,
            onRefresh: () => syncChrome(),
            onUpdate: (self) => {
              emit(self.progress);
              syncChrome();
            },
          },
        });

        // The photograph dissolves into the model as the study slides in.
        handoff
          .fromTo(
            overlay,
            { scale: 1, opacity: 1 },
            {
              scale: 1.08,
              opacity: 0,
              duration: 1,
              ease: "none",
              immediateRender: false,
            },
            0,
          )
          .to(canvas, { opacity: 1, duration: 1, ease: "none" }, 0);

        const pinTrigger = pin.scrollTrigger;
        const handoffTrigger = handoff.scrollTrigger;

        // One source of truth for the overlay's visibility and the header ink,
        // so both directions of travel and a mid-scroll refresh agree.
        syncChrome = () => {
          const pinned = pinTrigger?.progress ?? 0;
          const handed = handoffTrigger?.progress ?? 0;
          overlay.style.visibility =
            pinned > 0.0001 && handed < 0.999 ? "visible" : "hidden";
          setHeroDark(pinned >= 0.55 && handed < 0.55);
        };

        syncChrome();
      });

      const onRefresh = () => syncChrome();
      ScrollTrigger.addEventListener("refresh", onRefresh);

      teardown = () => {
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        context.revert();
        overlay.style.visibility = "hidden";
        setHeroDark(false);
        gsap.set(canvas, { clearProps: "opacity" });
        emit(0);
      };
    };

    build();

    const onQueryChange = () => build();
    reducedQuery.addEventListener("change", onQueryChange);
    wideQuery.addEventListener("change", onQueryChange);

    return () => {
      reducedQuery.removeEventListener("change", onQueryChange);
      wideQuery.removeEventListener("change", onQueryChange);
      teardown?.();
      setHeroDark(false);
      overlay.style.visibility = "hidden";
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(<Overlay />, document.body);
}
