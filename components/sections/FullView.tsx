import { ArrowRight } from "@/components/site/Icons";
import { Photo } from "@/components/site/Photo";
import { PhotoGallery } from "@/components/site/PhotoGallery";
import { StudyHandoff } from "@/components/sections/StudyHandoff";

export function FullView() {
  return (
    <section className="relative overflow-hidden bg-panel text-panel-ink">
      <div className="container-wide pt-10 md:pt-16">
        <div className="flex items-center justify-between gap-4 border-t border-panel-line pt-4">
          <p className="type-eyebrow">02 — Full view</p>
          <p className="type-micro text-panel-muted">
            Architecture · Interiors · Land
          </p>
        </div>
      </div>

      <h2 className="sr-only">Full view of the residences</h2>        <div
          data-study-stage
          className="relative flex min-h-[540px] items-center justify-center overflow-hidden py-14 md:min-h-[660px] md:py-20"
        >
        <div
          data-study-marquee
          aria-hidden="true"
          className="marquee marquee-mask absolute inset-x-0 top-1/2 -translate-y-1/2"
        >
          <div className="marquee-track items-center">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center">
                {Array.from({ length: 11 }).map((_, item) => (
                  <span
                    key={item}
                    className="type-mega whitespace-nowrap px-6 uppercase md:px-8"
                  >
                    ZARA
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center px-5">
          <figure
            data-study-print
            className="group w-[min(74vw,300px)] sm:w-[340px] md:w-[400px]"
          >
            <div
              data-hero-media
              data-study-print-box
              className="overflow-hidden rounded-[6px] shadow-[0_30px_80px_-20px_rgba(20,18,16,0.5)]"
            >
              <Photo
                name="hero5"
                alt="Villa front elevation with a concrete colonnade and olive tree at golden hour"
                sizes="(min-width: 768px) 400px, 74vw"
                className="img-zoom aspect-[5/4] w-full object-cover"
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <span className="type-micro text-panel-muted">
                Residence 01 — Front elevation
              </span>
              <span className="type-micro text-panel-muted">01 / 14</span>
            </figcaption>
          </figure>

          <div className="mt-6">
            <PhotoGallery label="View the full gallery" />
          </div>
        </div>
      </div>

      <div className="container-wide pb-10 md:pb-16">
        <div className="flex flex-col gap-6 border-t border-panel-line pt-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-[420px] text-[14px] leading-6 text-panel-muted">
            Fourteen frames, one afternoon. Photographed between four and six,
            when the light is at its most honest.
          </p>
          <a
            href="#full-view"
            className="link-under shrink-0 text-[14px]"
          >
            Explore the structure
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <StudyHandoff />
    </section>
  );
}
