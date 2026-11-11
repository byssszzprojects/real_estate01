import { Photo } from "@/components/site/Photo";

const notes = [
  {
    label: "Light",
    copy: "North light for the rooms we use in the morning; a low western sun for the ones we use at night.",
  },
  {
    label: "Material",
    copy: "A short palette, repeated until it disappears: lime, teak, stone, linen. Nothing that asks to be noticed.",
  },
  {
    label: "Proportion",
    copy: "Ceilings held at 3.2 metres. Sills deep enough to sit on. Doors a little wider than they need to be.",
  },
];

export function Quiet() {
  return (
    <section
      id="interiors"
      className="relative overflow-hidden bg-background text-foreground"
    >
      <Photo
        name="cloud-2-full"
        alt=""
        sizes="100vw"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45 dark:opacity-10"
      />

      <div className="container-wide relative py-10 md:py-16">
        <div className="flex items-center justify-between gap-4 border-t border-black/10 pt-4 dark:border-white/15">
          <p className="type-eyebrow">04 — Interiors</p>
          <p className="type-micro opacity-55">Residence 01 · Moira</p>
        </div>

        <div className="mx-auto mt-12 max-w-[883px] text-center" data-reveal>
          <h2 className="type-h3 text-balance">
            Not every space needs to be grand.
          </h2>
          <p className="mx-auto mt-6 max-w-[618px] text-[18px] leading-[1.55] opacity-70">
            A smaller room, a deeper sill, a window that opens the whole way.
            Comfort is mostly a matter of proportions — and the confidence to
            leave a wall alone.
          </p>
        </div>

        <figure
          className="group relative mt-10 overflow-hidden rounded-[18px]"
          data-reveal
        >
          <div className="drift">
            <div className="drift-layer">
              <Photo
                name="living-room-clean"
                alt="Dining and sitting room with a long timber table, leather chairs and afternoon sun across a stone floor."
                sizes="(min-width: 1440px) 1360px, 100vw"
                className="img-zoom aspect-[16/10] w-full object-cover object-[50%_48%] md:aspect-[21/9]"
              />
            </div>
          </div>
          <figcaption className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-white/60 bg-[#f5f0e6]/85 px-4 py-3 text-[#2a2725] backdrop-blur-md sm:right-auto sm:gap-10">
            <span className="type-micro">The quiet room</span>
            <span className="type-micro text-[#2a2725]/55">
              Dining · west light · 5.8 m
            </span>
          </figcaption>
        </figure>

        <div className="mt-10 grid gap-8 border-t border-black/10 pt-6 sm:grid-cols-3 sm:gap-6 dark:border-white/15">
          {notes.map((note, index) => (
            <div key={note.label} data-reveal style={{ transitionDelay: `${index * 90}ms` }}>
              <div className="flex items-baseline justify-between gap-4">
                <p className="type-micro opacity-55">0{index + 1}</p>
                <p className="type-micro opacity-55">{note.label}</p>
              </div>
              <p className="mt-3 max-w-[360px] text-[14px] leading-6 opacity-70">
                {note.copy}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
