"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import {
  registerScrollController,
  unregisterScrollController,
} from "@/lib/scroll-control";

/**
 * Lenis supplies the long, weighted scroll used by the reference site.
 * Native scrolling stays in place when motion is reduced or JS is unavailable.
 */
export function SmoothScroll() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let tick: ((time: number) => void) | null = null;

    const setup = () => {
      if (tick) {
        gsap.ticker.remove(tick);
        tick = null;
      }
      if (lenis) unregisterScrollController(lenis);
      lenis?.destroy();
      lenis = null;

      if (media.matches) return;

      lenis = new Lenis({
        autoRaf: false,
        autoToggle: false,
        lerp: 0.09,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.35,
        anchors: { duration: 1.15 },
        prevent: (node) => Boolean(node.closest("[data-lenis-prevent]")),
      });

      registerScrollController(lenis);
      lenis.on("scroll", ScrollTrigger.update);
      tick = (time) => lenis?.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    };

    setup();
    media.addEventListener("change", setup);

    return () => {
      media.removeEventListener("change", setup);
      if (tick) gsap.ticker.remove(tick);
      if (lenis) unregisterScrollController(lenis);
      lenis?.destroy();
    };
  }, []);

  return null;
}
