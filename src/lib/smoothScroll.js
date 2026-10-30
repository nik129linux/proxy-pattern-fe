import gsap from 'gsap';
import Lenis from 'lenis';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './motion.js';

/**
 * Drives page scroll from the GSAP ticker, so the DOM and the WebGL frame move
 * together. The glass panel is drawn in WebGL behind DOM text and would slip otherwise.
 */
export function startSmoothScroll() {
  if (reducedMotion()) return { scrollTo: (target) => document.querySelector(target)?.scrollIntoView(), stop: () => {} };

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  const tick = (time) => lenis.raf(time * 1000);

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  return {
    scrollTo: (target) => lenis.scrollTo(target, { offset: -24 }),
    stop: () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    },
  };
}
