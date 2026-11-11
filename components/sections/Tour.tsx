"use client";

import { useState } from "react";
import { ArrowUpRight } from "@/components/site/Icons";
import { TourViewer, type TourModel } from "@/components/three/TourViewer";

const tabs: { id: TourModel; label: string; meta: string }[] = [
  { id: "villa", label: "The villa", meta: "Residence 03" },
  { id: "apartment", label: "The apartment", meta: "Residence 02" },
];

export function Tour() {
  const [model, setModel] = useState<TourModel>("villa");

  return (
    <section id="tour" className="bg-panel text-panel-ink">
      <div className="container-wide py-10 md:py-16">
        <div className="flex items-center justify-between gap-4 border-t border-panel-line pt-4">
          <p className="type-eyebrow">06 — Explore the model</p>
          <p className="type-micro text-panel-muted">Interactive · WebGL</p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7" data-reveal>
            <h2 className="type-h3 text-balance">Walk around it.</h2>
            <p className="mt-5 max-w-[520px] text-panel-muted">
              Both residences, modelled as 1:100 studies before they were
              built. Drag to look closer; the drawing holds up from every side.
            </p>
          </div>

          <div className="md:col-span-5 md:justify-self-end">
            <div
              role="group"
              aria-label="Choose a model"
              className="inline-flex rounded-full border border-panel-line p-1"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setModel(tab.id)}
                  aria-pressed={model === tab.id}
                  className={`rounded-full px-4 py-2.5 text-[12px] uppercase tracking-[0.1em] transition-colors duration-300 ${
                    model === tab.id
                      ? "bg-[#2a2725] text-[#ede6d6]"
                      : "text-[#2a2725]/70 hover:bg-[#2a2725]/5"
                  }`}
                >
                  {tab.label}
                  <span className="sr-only"> — {tab.meta}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <TourViewer model={model} />
        </div>

        <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-panel-muted sm:hidden">
          Drag to rotate
        </p>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="type-micro text-panel-muted">
            Draco-compressed GLB · Sky-cube lighting · Two study models
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#interiors" className="link-under text-[13px]">
              Prefer photographs
            </a>
            <a href="#enquire" className="link-under text-[13px]">
              Request the drawings
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
