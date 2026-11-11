import { ArrowUpRight } from "@/components/site/Icons";
import { Photo } from "@/components/site/Photo";

const offerings = [
  {
    term: "Furnished stays",
    copy: "A month or a season, with linen, garden and housekeeping included.",
  },
  {
    term: "Property care",
    copy: "A fixed monthly fee for homes left empty part of the year.",
  },
  {
    term: "Resident support",
    copy: "One number for the garden, the pool, the paperwork and the keys.",
  },
];

export function Stay() {
  return (
    <section id="stays" className="bg-panel text-panel-ink">
      <div className="container-wide py-10 md:py-16">
        <div className="flex items-center justify-between gap-4 border-t border-panel-line pt-4">
          <p className="type-eyebrow">05 — Stays &amp; stewardship</p>
          <p className="type-micro hidden text-panel-muted sm:block">
            By the month or season
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:mt-16 md:grid-cols-12 md:gap-8">
          <figure className="group relative min-h-[420px] overflow-hidden rounded-[24px] md:col-span-7 md:min-h-[560px]">
            <Photo
              name="exterior-garden-clean"
              alt="Lime-plaster house with a shaded terrace, lounge chairs and a garden of grasses."
              sizes="(min-width: 768px) 55vw, 100vw"
              className="img-zoom absolute inset-0 h-full w-full object-cover object-[46%_center]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100f0d]/65 via-transparent to-transparent" />

            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white md:p-6">
              <p className="type-micro text-white/65">The garden terrace</p>
              <p className="mt-2 max-w-[360px] font-serif text-[2rem] leading-[1.05]">
                Breakfast outside, most of the year.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/35 bg-black/25 px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] backdrop-blur-md">
                  Sleeps six
                </span>
                <span className="rounded-full border border-white/35 bg-black/25 px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] backdrop-blur-md">
                  Three bedrooms
                </span>
                <span className="rounded-full border border-white/35 bg-black/25 px-3 py-1.5 text-[11px] uppercase tracking-[0.1em] backdrop-blur-md">
                  Private pool
                </span>
              </div>
            </figcaption>
          </figure>

          <div className="flex flex-col justify-between gap-8 md:col-span-5">
            <div data-reveal>
              <h2 className="type-h3 text-balance">
                A different way to stay.
              </h2>
              <p className="mt-5 max-w-[420px] text-panel-muted">
                Some houses are better lived in than sold. We look after a small
                group of residences for owners who are away — and open them to
                guests who would rather stay in a home than a hotel.
              </p>
            </div>

            <dl className="border-t border-panel-line">
              {offerings.map((item) => (
                <div
                  key={item.term}
                  className="grid gap-2 border-b border-panel-line py-4 sm:grid-cols-[140px_1fr] sm:gap-4"
                >
                  <dt className="text-[14px] leading-6">{item.term}</dt>
                  <dd className="text-[14px] leading-6 text-panel-muted">
                    {item.copy}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap items-center gap-6">
              <a href="#enquire" className="pill pill-dark">
                Enquire about stays
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <p className="type-micro text-panel-muted">Minimum one month</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
