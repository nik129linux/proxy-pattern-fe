import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const motion = {
  count: 0.8,
  rowIn: 0.36,
  alarm: 0.6,
  hero: 1.1,
  float: 0.9,
  stagger: 0.04,
  easeOut: 'expo.out',
};

export function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Numbers roll to their new value instead of jumping. */
export function countTo(element, from, to, format) {
  if (reducedMotion() || from === to) {
    element.textContent = format(to);
    return;
  }
  const state = { value: from };
  gsap.to(state, {
    value: to,
    duration: motion.count,
    ease: motion.easeOut,
    overwrite: true,
    onUpdate: () => {
      element.textContent = format(state.value);
    },
  });
}

/** New log rows settle softly into the list. */
export function rowDrop(elements) {
  if (reducedMotion() || elements.length === 0) return;
  gsap.fromTo(
    elements,
    { y: -8, opacity: 0 },
    { y: 0, opacity: 1, duration: motion.rowIn, stagger: motion.stagger, ease: motion.easeOut, overwrite: true },
  );
}

/** A service crossing the alarm line settles in with a small swell. */
export function alarmFlip(element) {
  if (reducedMotion()) return;
  gsap.fromTo(element, { scale: 0.97 }, { scale: 1, duration: motion.alarm, ease: motion.easeOut, overwrite: true });
}

/** Hero lines rise through their masks. */
export function heroIn(lines) {
  if (reducedMotion()) return;
  gsap.fromTo(lines, { yPercent: 105 }, { yPercent: 0, duration: motion.hero, stagger: 0.09, ease: motion.easeOut });
}

/** Cards float up onto the sky once, in order. */
export function floatIn(element, index) {
  if (reducedMotion()) return;
  gsap.fromTo(
    element,
    { y: 32, opacity: 0 },
    { y: 0, opacity: 1, duration: motion.float, delay: index * 0.09, ease: motion.easeOut },
  );
}

/** The one scroll moment: the hero copy drifts back as the cards rise over it. */
export function heroDrift(element) {
  if (reducedMotion() || window.innerWidth < 768) return () => {};
  const tween = gsap.to(element, {
    y: 64,
    opacity: 0.35,
    ease: 'none',
    scrollTrigger: { trigger: element, start: 'top top', end: 'bottom top', scrub: 0.6 },
  });
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
