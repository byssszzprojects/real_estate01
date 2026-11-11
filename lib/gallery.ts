import type { ImageName } from "@/components/site/Photo";

export type GalleryItem = {
  name: ImageName;
  alt: string;
  caption: string;
};

/** Placeholder photography from the reference asset pack. */
export const galleryItems: GalleryItem[] = [
  {
    name: "top",
    alt: "Aerial view at sunset of a flat-roofed stone villa on a hilltop, its deep terrace set with sofas, olive trees below and a wide valley and mountains beyond.",
    caption: "Hilltop villa — Aerial at sunset",
  },
  {
    name: "exterior-garden-clean",
    alt: "Single-storey lime-plaster house under a clear blue sky, two grey armchairs and a low table on the terrace, sliding glass doors and a timber entrance panel, grasses along the front.",
    caption: "Garden house — Terrace and entrance",
  },
  {
    name: "patio-front-clean",
    alt: "Timber-clad single-storey pavilion with a sheltered patio, a pale sofa and armchairs beside glass doors, an olive tree in gravel planting and a lawn in the foreground.",
    caption: "Timber pavilion — Sheltered patio",
  },
  {
    name: "landscape-house-clean",
    alt: "Two-storey white villa seen from three-quarters in a wild meadow, glowing living rooms behind full-height glazing and a red and a silver car parked under the timber carport.",
    caption: "Meadow villa — Carport at dusk",
  },
  {
    name: "nightSide",
    alt: "Stone villa at dusk with a long colonnade of textured columns, warm wall lights washing each bay, lit interiors and a sun setting under a blue and orange sky.",
    caption: "Colonnade — Dusk",
  },
  {
    name: "living-room-clean",
    alt: "Living and dining room in warm plaster: a long timber table on black X legs with tan leather chairs, leather lounge chairs, a stone coffee table and a timber kitchen beyond.",
    caption: "Living and dining — Afternoon light",
  },
  {
    name: "kitchen-clean",
    alt: "Kitchen and dining space with oak cabinetry and an island, a timber table with oak chairs in the foreground and low sun raking across steel-framed windows.",
    caption: "Kitchen and dining — Late sun",
  },
  {
    name: "side",
    alt: "Close oblique view along a marble colonnade at golden hour, tall glazed bays between veined columns, a lit wall sconce and a planted bed above polished stone paving.",
    caption: "Marble colonnade — Wall light",
  },
];
