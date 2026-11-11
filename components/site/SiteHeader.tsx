"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "./Icons";

const links = [
  { href: "#residences", label: "Residences" },
  { href: "#architecture", label: "Architecture" },
  { href: "#interiors", label: "Interiors" },
  { href: "#stays", label: "Stays" },
  { href: "#tour", label: "3D tour" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const [stageActive, setStageActive] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 32);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onStage = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean }>).detail;
      setStageActive(Boolean(detail?.active));
    };
    window.addEventListener("zara:stage", onStage);
    return () => window.removeEventListener("zara:stage", onStage);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navMode = open
    ? "nav-solid"
    : stageActive
      ? "nav-stage"
      : scrolled
        ? "nav-solid"
        : "nav-top";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${navMode}`}
    >
      <div className="relative">
      <div className="container-wide flex h-20 items-center justify-between gap-6">
        <a
          href="#top"
          className="text-[16px] font-bold uppercase leading-[1.15] tracking-[-0.025em]"
          aria-label="ZARA — back to top"
        >
          ZARA
        </a>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-10 lg:flex"
        >
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] leading-6 opacity-80 transition-opacity duration-300 hover:opacity-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#enquire"
            className="pill pill-cream hidden min-h-[44px] px-5 text-[14px] sm:inline-flex"
          >
            <span className="hidden md:inline">Book a private viewing</span>
            <span className="md:hidden">Book a viewing</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-current/30 lg:hidden"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <span aria-hidden="true" className="relative block h-3.5 w-5">
              <span
                className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 ${
                  open ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1/2 h-px w-full bg-current transition-opacity duration-300 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 ${
                  open ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-current/10"
        >
          <div
            className="h-px origin-left bg-[#3fa85b]"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          data-lenis-prevent
          className="h-[calc(100svh-80px)] overflow-y-auto bg-[#ede6d6] text-[#2a2725] lg:hidden"
        >
          <div className="container-wide flex min-h-full flex-col justify-between gap-10 py-8">
            <nav aria-label="Mobile" className="flex flex-col">
              {links.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between border-b border-[#2a2725]/15 py-5 font-serif text-[clamp(2rem,9vw,3rem)] leading-none"
                >
                  {link.label}
                  <span className="type-micro text-[#2a2725]/45">
                    0{index + 1}
                  </span>
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-6">
              <a
                href="#enquire"
                onClick={() => setOpen(false)}
                className="pill pill-dark w-full"
              >
                Book a private viewing
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <div className="flex items-center justify-between text-[14px] text-[#2a2725]/70">
                <span>Assagao, Goa</span>
                <a href="mailto:hello@zarastudio.in" className="underline">
                  hello@zarastudio.in
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
