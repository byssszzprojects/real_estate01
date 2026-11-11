import { Photo } from "@/components/site/Photo";

/**
 * A quiet atmospheric pause after the pinned structure study. The cloud layers
 * are scrubbed by the motion system; this section only supplies the stage.
 */
export function FogTransition() {
  return (
    <section
      data-fog
      aria-hidden="true"
      className="relative z-20 -mt-[8vh] -mb-[6vh] h-[62svh] min-h-[380px] overflow-hidden bg-[linear-gradient(180deg,#cfe6f5_0%,#d9e8e9_42%,#e8e2d8_74%,#ede6d6_100%)]"
    >
      <div
        data-fog-cloud="1"
        data-fog-depth="0.8"
        className="absolute inset-x-[-8%] top-[6%] opacity-0"
      >
        <Photo
          name="cloud-2-full"
          alt=""
          sizes="116vw"
          className="h-auto w-full max-w-none object-cover"
        />
      </div>

      <div
        data-fog-cloud="2"
        data-fog-depth="1.25"
        className="absolute inset-x-[-14%] bottom-[-12%] opacity-0"
      >
        <Photo
          name="cloud-1-cropped"
          alt=""
          sizes="128vw"
          className="h-auto w-full max-w-none object-cover"
        />
      </div>

      <div
        data-fog-wash
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-[#ede6d6]"
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 text-[#2a2725]/50 md:p-10">
        <p className="type-micro">05 — Interiors</p>
        <p className="type-micro">Through the weather</p>
      </div>
    </section>
  );
}
