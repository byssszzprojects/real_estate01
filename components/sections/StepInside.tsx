import { ArrowUpRight } from "@/components/site/Icons";
import { Photo } from "@/components/site/Photo";
import { PhotoGallery } from "@/components/site/PhotoGallery";

export function StepInside() {
  return (
    <section className="bg-panel text-panel-ink">
      <div className="container-wide py-10 md:py-16">
        <figure className="group relative min-h-[520px] overflow-hidden rounded-[36px] md:min-h-[640px]">
          <Photo
            name="apartment-tour"
            alt="Single-storey white residence at sunset, its glass walls opening onto a lawn and terrace."
            sizes="100vw"
            className="img-zoom absolute inset-0 h-full w-full object-cover object-[50%_55%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100f0d]/78 via-[#100f0d]/18 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex justify-end p-5 md:p-8">
            <div className="hidden rounded-full border border-white/35 bg-white/10 px-4 py-2 text-white backdrop-blur-md md:block">
              <span className="type-micro">Assagao · 3 bedrooms · 2,150 sq ft</span>
            </div>
          </div>

          <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
            <p className="type-eyebrow text-white/70">
              Explore residence 02
            </p>
            <p className="type-h3 mt-4">Step inside.</p>
            <p className="mt-4 max-w-[420px] text-[16px] leading-6 text-white/80">
              Three bedrooms, a courtyard, and a roof terrace that faces the
              rice fields. Available to view this week, privately.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <a href="#enquire" className="pill pill-cream">
                Explore residence 02
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a href="#enquire" className="link-under text-[14px] text-white">
                Book a viewing
              </a>
            </div>
          </figcaption>
        </figure>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-micro text-panel-muted">
            Photography — 14 frames · Residence 02
          </p>
          <PhotoGallery
            label="View the photographs"
            className="self-start sm:self-auto"
          />
        </div>
      </div>
    </section>
  );
}
