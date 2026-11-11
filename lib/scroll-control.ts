type ScrollController = {
  stop: () => void;
  start: () => void;
};

let controller: ScrollController | null = null;
let locked = false;
let previousOverflow = "";

export function registerScrollController(next: ScrollController) {
  controller = next;
  if (locked) next.stop();
}

export function unregisterScrollController(next: ScrollController) {
  if (controller === next) controller = null;
}

/** Stops both Lenis and native scrolling while the opening frame is visible. */
export function lockScroll() {
  if (typeof document === "undefined") return;
  if (!locked) previousOverflow = document.documentElement.style.overflow;
  locked = true;
  controller?.stop();
  document.documentElement.style.overflow = "hidden";
}

/** Restores Lenis so the hero can hand over to the normal weighted scroll. */
export function unlockScroll() {
  if (typeof document === "undefined") return;
  locked = false;
  controller?.start();
  document.documentElement.style.overflow = previousOverflow;
}
