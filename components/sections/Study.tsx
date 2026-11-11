import { Photo } from "@/components/site/Photo";

const facts = [
  { label: "Ceilings", value: "3.2 m" },
  { label: "Glazing", value: "Full height" },
  { label: "Materials", value: "Lime, teak, terrazzo" },
  { label: "Orientation", value: "North–south" },
  { label: "Completion", value: "2025" },
];

export function Study() {
  return (
    <section id="architecture" className="bg-panel text-panel-ink">
      <div className="container-wide py-10 md:py-16">
        <div className="flex items-center justify-between gap-4 border-t border-panel-line pt-4">
          <p className="type-eyebrow">03 — Architecture</p>
          <p className="type-micro text-panel-muted">Residence 03 · Assagao</p>
        </div>

        <h2
          className="type-h3 mt-8 max-w-[883px] text-balance"
          data-reveal
        >
          A study in form, light and proportion.
        </h2>

        <div className="mt-10 grid gap-10 md:mt-16 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-5" data-reveal>
            <div className="max-w-[618px] space-y-4 text-panel-muted">
              <p>
                The house is arranged around a shaded court. Rooms open one into
                the next, but never all at once; a low wall, a change in floor
                level, a doorway held slightly off-axis.
              </p>
              <p>
                Materials were chosen for how they age rather than how they
                photograph: lime plaster that softens, teak that darkens,
                terrazzo ground and re-ground until it reads as one surface.
              </p>
            </div>

            <dl className="mt-8 max-w-[520px] border-y border-panel-line">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-baseline justify-between gap-6 border-b border-panel-line py-3 last:border-b-0"
                >
                  <dt className="type-micro text-panel-muted">
                    {fact.label}
                  </dt>
                  <dd className="text-[14px] leading-6">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 max-w-[420px] text-[14px] leading-6 text-panel-muted">
              Drawings, material samples and the full specification are shared
              privately, before a first visit.
            </p>
          </div>

          <div
            className="relative md:col-span-6 md:col-start-7 md:pb-12"
            data-reveal
            style={{ transitionDelay: "120ms" }}
          >
            <figure className="group drift overflow-hidden rounded-[24px]">
              <div className="drift-layer">
                <Photo
                  name="side"
                  alt="Close view of a stone colonnade with warm wall lights and layered planting."
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="img-zoom aspect-[4/5] w-full object-cover object-[60%_center]"
                />
              </div>
            </figure>

            <figure className="absolute -bottom-0 left-0 hidden w-[46%] overflow-hidden rounded-[18px] border-[6px] border-[#ede6d6] shadow-[0_18px_50px_-20px_rgba(20,18,16,0.45)] md:block">
              <Photo
                name="top"
                alt="Aerial view of a stone residence beside a planted courtyard and open valley."
                sizes="25vw"
                className="aspect-[4/3] w-full object-cover"
              />
            </figure>

            <p className="mt-4 type-micro text-panel-muted md:absolute md:-bottom-10 md:left-[50%]">
              The colonnade, looking west.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
