"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import { galleryItems } from "@/lib/gallery";
import { ArrowRight, Close } from "./Icons";
import { Photo } from "./Photo";

type PhotoGalleryProps = {
  label?: string;
  className?: string;
};

export function PhotoGallery({
  label = "Open the full gallery",
  className = "",
}: PhotoGalleryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (index !== null && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    }
    if (index === null && dialog.open) {
      dialog.close();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [index]);

  useEffect(() => {
    if (index === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setIndex((value) =>
          value === null ? 0 : (value + 1) % galleryItems.length,
        );
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) =>
          value === null
            ? 0
            : (value - 1 + galleryItems.length) % galleryItems.length,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index]);

  useEffect(() => {
    if (index === null) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const image = dialog.querySelector<HTMLImageElement>("figure img");
    if (image) {
      gsap.fromTo(
        image,
        { clipPath: "inset(12% 0% 12% 0%)", scale: 1.15 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          scale: 1,
          duration: 0.85,
          ease: "expo.out",
          clearProps: "transform,clipPath",
        },
      );
    }

    const thumbnails = dialog.querySelectorAll("button > img");
    if (thumbnails.length) {
      gsap.fromTo(
        thumbnails,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.025,
          ease: "expo.out",
        },
      );
    }
  }, [index]);

  const current = index === null ? null : galleryItems[index];

  return (
    <>
      <button
        type="button"
        onClick={() => setIndex(0)}
        className={`pill pill-dark group ${className}`}
      >
        {label}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        <span className="sr-only">
          — opens a viewer with {galleryItems.length} photographs
        </span>
      </button>

      <dialog
        ref={dialogRef}
        data-lenis-prevent
        aria-label="Photography viewer"
        onClose={() => setIndex(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setIndex(null);
        }}
        className="gallery-dialog m-auto max-h-[92svh] w-[min(1180px,94vw)] rounded-[18px] border-0 bg-[#ede6d6] p-0 text-[#2a2725] shadow-2xl"
      >
        {current && (
          <div className="flex max-h-[92svh] flex-col">
            <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
              <div className="min-w-0">
                <p className="type-micro text-[#2a2725]/55">
                  Full view — {String((index ?? 0) + 1).padStart(2, "0")} /{" "}
                  {galleryItems.length}
                </p>
                <p className="truncate text-[14px]">{current.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setIndex(null)}
                autoFocus
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#2a2725]/20 transition-colors duration-300 hover:bg-[#2a2725] hover:text-[#ede6d6]"
              >
                <Close className="h-4 w-4" />
                <span className="sr-only">Close viewer</span>
              </button>
            </div>

            <figure className="flex min-h-0 flex-1 items-center justify-center bg-[#e4ddcf] px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current.name}
                src={`/images/${current.name}.webp`}
                alt={current.alt}
                className="max-h-[64svh] w-auto max-w-full object-contain"
                width={1600}
                height={900}
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </figure>

            <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
              <p className="max-w-[52ch] text-[14px] leading-6 text-[#2a2725]/65">
                {current.alt}
              </p>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setIndex(
                      (value) =>
                        (value === null
                          ? 0
                          : value - 1 + galleryItems.length) %
                        galleryItems.length,
                    )
                  }
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2a2725]/20 transition-colors duration-300 hover:bg-[#2a2725] hover:text-[#ede6d6]"
                >
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  <span className="sr-only">Previous photograph</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setIndex((value) =>
                      value === null ? 0 : (value + 1) % galleryItems.length,
                    )
                  }
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#2a2725]/20 transition-colors duration-300 hover:bg-[#2a2725] hover:text-[#ede6d6]"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span className="sr-only">Next photograph</span>
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-t border-[#2a2725]/10 px-5 py-3 md:px-6">
              {galleryItems.map((item, itemIndex) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIndex(itemIndex)}
                  aria-label={`Show ${item.caption}`}
                  aria-current={itemIndex === index}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-[6px] transition-opacity duration-300 ${
                    itemIndex === index
                      ? "opacity-100 ring-1 ring-[#2a2725]"
                      : "opacity-55 hover:opacity-90"
                  }`}
                >
                  <Photo
                    name={item.name}
                    alt=""
                    sizes="80px"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
