import gsap from 'gsap';

export const motion = {
  flap: 0.32,
  rowDrop: 0.42,
  alarm: 0.6,
  hero: 1.1,
  stagger: 0.05,
  easeOut: 'expo.out',
};

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** A digit tile rotates down like a split-flap character landing. */
export function flapDigit(element) {
  if (reducedMotion()) return;
  gsap.fromTo(
    element,
    { rotateX: -88, transformOrigin: '50% 50%' },
    { rotateX: 0, duration: motion.flap, ease: motion.easeOut, overwrite: true },
  );
}

/** New board rows drop into place from behind the row above. */
export function rowDrop(elements) {
  if (reducedMotion() || elements.length === 0) return;
  gsap.fromTo(
    elements,
    { yPercent: -60, opacity: 0, rotateX: -35, transformOrigin: '50% 0%' },
    { yPercent: 0, opacity: 1, rotateX: 0, duration: motion.rowDrop, stagger: motion.stagger, ease: motion.easeOut, overwrite: true },
  );
}

/** A service crossing the alarm line turns over like a board panel. */
export function alarmFlip(element) {
  if (reducedMotion()) return;
  gsap.fromTo(
    element,
    { rotateX: -70, transformOrigin: '50% 0%' },
    { rotateX: 0, duration: motion.alarm, ease: motion.easeOut, overwrite: true },
  );
}

/** Hero title lines rise through their masks. */
export function heroIn(lines) {
  if (reducedMotion()) return;
  gsap.fromTo(
    lines,
    { yPercent: 105 },
    { yPercent: 0, duration: motion.hero, stagger: 0.09, ease: motion.easeOut },
  );
}
