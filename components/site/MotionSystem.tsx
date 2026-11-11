"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, SplitText } from "@/lib/gsap";

type MotionRecord = {
  selector: string;
  kind: string;
  detail: string;
  trigger: string;
};

type MotionWindow = Window & {
  __zaraMotion?: {
    scrollTriggers: number;
    images: number;
    headings: number;
    paragraphs: number;
    elements: MotionRecord[];
  };
};

function selectorFor(element: Element) {
  if (element.id) return `#${CSS.escape(element.id)}`;

  const parts: string[] = [];
  let node: Element | null = element;

  while (node && node.nodeType === 1 && parts.length < 4) {
    let part = node.tagName.toLowerCase();
    const classes = Array.from(node.classList)
      .filter((name) => !name.startsWith("gsap"))
      .slice(0, 2);

    if (classes.length) {
      part += `.${classes.map((name) => CSS.escape(name)).join(".")}`;
    }

    const parent: HTMLElement | null = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === node?.tagName,
      );
      if (siblings.length > 1 && node) {
        part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
    }

    parts.unshift(part);
    node = parent;
  }

  return parts.join(" > ");
}

function numericObjectY(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 50;
}

/**
 * Motion is deliberately mounted after the preloader hands over. That keeps the
 * initial split measurements independent of the fixed opening frame, and means
 * the Three.js viewers and their scroll logic are not touched.
 */
export function MotionSystem() {
  useEffect(() => {
    const html = document.documentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const records = new Map<Element, MotionRecord>();
    const splits: SplitText[] = [];
    const observers: MutationObserver[] = [];
    let context: ReturnType<typeof gsap.context> | null = null;
    let started = false;
    let disposed = false;
    let refreshFrame = 0;

    const record = (element: Element, kind: string, detail: string, trigger?: Element) => {
      element.setAttribute("data-motion", kind);
      if (records.has(element)) return;
      records.set(element, {
        selector: selectorFor(element),
        kind,
        detail,
        trigger: selectorFor(trigger ?? element),
      });
    };

    const revealParent = (element: Element) => {
      const parent = element.closest<HTMLElement>("[data-reveal]");
      parent?.classList.add("is-visible");
    };

    const refresh = () => {
      if (disposed) return;
      window.cancelAnimationFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        publish();
      });
    };

    const publish = () => {
      if (disposed) return;
      const triggers = ScrollTrigger.getAll();
      const elements = Array.from(records.values());
      const payload = {
        scrollTriggers: triggers.length,
        images: elements.filter((item) => item.kind === "image").length,
        headings: elements.filter((item) => item.kind === "heading").length,
        paragraphs: elements.filter((item) => item.kind === "paragraph").length,
        elements,
      };

      (window as MotionWindow).__zaraMotion = payload;
      html.dataset.motionScrollTriggers = String(triggers.length);
      console.info(
        `[zara motion] ${triggers.length} ScrollTriggers · ${payload.images} images · ${payload.headings} headings · ${payload.paragraphs} paragraphs`,
      );
    };

    const initText = () => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>(
          "main h1, main h2, main p, footer h2",
        ),
      ).filter((element) => {
        if (element.id === "fullview-title") return false;
        if (element.closest("[data-split='manual']")) return false;
        if (element.classList.contains("sr-only")) return false;
        if (element.closest("dialog, [data-fog], [aria-hidden='true']")) {
          return false;
        }

        const size = Number.parseFloat(
          window.getComputedStyle(element).fontSize,
        );
        const isHeading = /^H[12]$/.test(element.tagName);
        if (!isHeading && (!Number.isFinite(size) || size < 18)) return false;
        if (
          !isHeading &&
          (element.textContent ?? "").trim().split(/\s+/).length < 5
        ) {
          return false;
        }

        return true;
      });

      nodes.forEach((element) => {
        const size = Number.parseFloat(
          window.getComputedStyle(element).fontSize,
        );
        const big = size >= 42;
        const isHeading = /^H[12]$/.test(element.tagName);
        const split = SplitText.create(element, {
          type: big ? "lines,words" : "lines",
          mask: big ? "words" : "lines",
          linesClass: "motion-line",
          wordsClass: "motion-word",
          autoSplit: true,
          aria: "auto",
          onSplit: (instance) => {
            const targets = big ? instance.words : instance.lines;
            record(
              element,
              isHeading ? "heading" : "paragraph",
              big
                ? "masked words, yPercent 115 → 0, scale/line stagger"
                : "masked lines, yPercent 110 → 0",
            );

            return gsap.from(targets, {
              yPercent: big ? 115 : 110,
              duration: big ? 1.02 : 0.92,
              stagger: big ? 0.042 : 0.075,
              ease: "expo.out",
              onStart: () => revealParent(element),
              scrollTrigger: {
                trigger: element,
                start: "top 88%",
                once: true,
              },
            });
          },
        });

        splits.push(split);
      });
    };

    const initImages = () => {
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>("main img, footer img"),
      ).filter((image) => {
        const src = image.getAttribute("src") ?? "";
        if (!src.startsWith("/images/")) return false;
        if (
          image.closest(
            "dialog, [data-fog], [data-hero-media], .intro, .collage-card, .collage-main",
          )
        ) {
          return false;
        }
        if (image.offsetWidth === 0 || image.offsetHeight === 0) return false;
        return true;
      });

      images.forEach((image, index) => {
        const frame =
          image.closest("figure") ??
          image.closest<HTMLElement>("[data-media-frame]") ??
          image.parentElement ??
          image;
        const section = image.closest("section");
        const heading = section?.querySelector<HTMLElement>("h1, h2");
        const sectionWidth = section?.clientWidth ?? window.innerWidth;
        const imageRect = image.getBoundingClientRect();
        let side = 0;

        if (heading && !heading.classList.contains("sr-only")) {
          const headingRect = heading.getBoundingClientRect();
          const imageCenter = imageRect.left + imageRect.width / 2;
          const headingCenter = headingRect.left + headingRect.width / 2;
          if (
            imageRect.width < sectionWidth * 0.72 &&
            imageCenter > headingCenter + 60
          ) {
            side = 1;
          } else if (
            imageRect.width < sectionWidth * 0.72 &&
            imageCenter < headingCenter - 60
          ) {
            side = -1;
          }
        }

        const speed = 0.55 + ((index * 0.23) % 0.9);
        const computed = window.getComputedStyle(image);
        const objectX = computed.objectPosition.split(/\s+/)[0] ?? "50%";
        const objectY = numericObjectY(
          computed.objectPosition.split(/\s+/)[1] ?? "50%",
        );
        const travel = 3.5 + speed * 3.5;

        image.dataset.motionImage = "true";
        image.dataset.motionSpeed = speed.toFixed(2);
        if (side !== 0) image.dataset.motionSide = side > 0 ? "right" : "left";
        record(
          image,
          "image",
          `clip-path reveal, scale 1.15 → 1, object-position parallax (${speed.toFixed(2)}×)${side ? `, ${side > 0 ? "right" : "left"} side slide` : ""}`,
          frame,
        );

        gsap.fromTo(
          image,
          {
            clipPath: "inset(14% 0% 14% 0%)",
            scale: 1.15,
            xPercent: side * 6,
          },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            xPercent: 0,
            duration: 1.1 + (index % 3) * 0.08,
            ease: "expo.out",
            scrollTrigger: {
              trigger: frame,
              start: "top 88%",
              once: true,
            },
            onComplete: () => {
              gsap.set(image, { clearProps: "transform,clipPath" });
            },
          },
        );

        gsap.fromTo(
          image,
          { objectPosition: `${objectX} ${objectY - travel}%` },
          {
            objectPosition: `${objectX} ${objectY + travel}%`,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
            },
          },
        );
      });

      const heroMedia = document.querySelector<HTMLElement>("[data-hero-media]");
      const heroImage = heroMedia?.querySelector<HTMLImageElement>("img");
      if (heroMedia && heroImage) {
        heroImage.dataset.motionImage = "hero";
        record(
          heroMedia,
          "image",
          "hero clip-path reveal, scale 1.15 → 1, object-position parallax",
          document.querySelector("#top") ?? heroMedia,
        );
        gsap.fromTo(
          heroMedia,
          {
            clipPath: "inset(8% 3% 8% 3%)",
            scale: 1.15,
          },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            scale: 1,
            duration: 1.35,
            delay: 0.15,
            ease: "expo.out",
            onComplete: () => {
              gsap.set(heroMedia, { clearProps: "transform,clipPath" });
            },
          },
        );

        gsap.fromTo(
          heroImage,
          { objectPosition: "58% 36%" },
          {
            objectPosition: "58% 58%",
            ease: "none",
            scrollTrigger: {
              trigger: "#top",
              start: "top top",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );
      }
    };

    const initFooter = () => {
      const footer = document.querySelector<HTMLElement>("footer#enquire");
      if (!footer) return;

      const items = Array.from(
        footer.querySelectorAll<HTMLElement>("p, a"),
      ).filter((item) => !item.closest("h2"));

      items.forEach((item) => record(item, "footer", "fade and rise, staggered"));
      if (items.length === 0) return;

      gsap.fromTo(
        items,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.055,
          ease: "expo.out",
          scrollTrigger: {
            trigger: footer,
            start: "top 82%",
            once: true,
          },
        },
      );
    };

    const initDynamicHeading = () => {
      const section = document.querySelector<HTMLElement>("#full-view");
      const title = section?.querySelector<HTMLElement>("#fullview-title");
      if (!section || !title) return;

      let lastTitle = title.textContent ?? "";
      record(
        title,
        "heading",
        "dynamic structure title: GSAP clip-path/y reveal on first view and every stage change",
        section,
      );

      const animateTitle = (force = false) => {
        const current = document.querySelector<HTMLElement>("#fullview-title");
        if (!current) return;
        const nextTitle = current.textContent ?? "";
        if (!force && nextTitle === lastTitle) return;
        lastTitle = nextTitle;
        current.setAttribute("data-motion", "heading");

        gsap.fromTo(
          current,
          { clipPath: "inset(0% 0% 105% 0%)", yPercent: 16 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            yPercent: 0,
            duration: 0.8,
            ease: "expo.out",
            onComplete: () =>
              gsap.set(current, { clearProps: "clipPath,transform" }),
          },
        );
      };

      ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        once: true,
        onEnter: () => animateTitle(true),
      });

      const observer = new MutationObserver(() => animateTitle());
      observer.observe(section, {
        subtree: true,
        childList: true,
        characterData: true,
      });
      observers.push(observer);
    };

    const initFog = () => {
      const fog = document.querySelector<HTMLElement>("[data-fog]");
      if (!fog) return;

      const layers = Array.from(
        fog.querySelectorAll<HTMLElement>("[data-fog-cloud]"),
      );
      const wash = fog.querySelector<HTMLElement>("[data-fog-wash]");
      record(fog, "fog", "scrubbed cloud opacity 0 → 1 → 0 and y translation");

      layers.forEach((layer, index) => {
        record(
          layer,
          "fog",
          `cloud layer ${index + 1}, opacity 0 → 1 → 0, yPercent translate`,
          fog,
        );
      });
      if (wash) {
        record(wash, "fog", "cream wash at the lower edge", fog);
      }

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: fog,
          start: "top 90%",
          end: "bottom 10%",
          scrub: 0.8,
        },
      });

      const layerOne = layers[0];
      const layerTwo = layers[1];
      if (layerOne) {
        timeline
          .fromTo(
            layerOne,
            { opacity: 0, yPercent: 18 },
            { opacity: 0.92, yPercent: -4, duration: 0.55, ease: "none" },
            0,
          )
          .to(
            layerOne,
            { opacity: 0, yPercent: -22, duration: 0.45, ease: "none" },
            0.55,
          );
      }
      if (layerTwo) {
        timeline
          .fromTo(
            layerTwo,
            { opacity: 0, yPercent: 26 },
            { opacity: 0.72, yPercent: 2, duration: 0.5, ease: "none" },
            0.12,
          )
          .to(
            layerTwo,
            { opacity: 0, yPercent: -14, duration: 0.5, ease: "none" },
            0.62,
          );
      }
      if (wash) {
        timeline.fromTo(
          wash,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, ease: "none" },
          0.5,
        );
      }
    };

    const start = () => {
      if (started || disposed) return;
      started = true;

      if (reduced) {
        document
          .querySelectorAll<HTMLElement>("[data-reveal]")
          .forEach((node) => node.classList.add("is-visible"));
        publish();
        return;
      }

      context = gsap.context(() => {
        initText();
        initDynamicHeading();
        initImages();
        initFooter();
        initFog();
      });

      refresh();
      window.addEventListener("load", refresh);
      window.addEventListener("resize", refresh);
      void document.fonts?.ready.then(refresh);
    };

    if (html.dataset.motionReady === "true") {
      start();
    } else {
      window.addEventListener("zara:preloader-done", start, { once: true });
    }

    return () => {
      disposed = true;
      window.removeEventListener("zara:preloader-done", start);
      window.removeEventListener("load", refresh);
      window.removeEventListener("resize", refresh);
      window.cancelAnimationFrame(refreshFrame);
      observers.forEach((observer) => observer.disconnect());
      splits.forEach((split) => split.revert());
      context?.revert();
    };
  }, []);

  return null;
}
