import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { getLogs } from '../api/metricsApi.js';
import { usePolling } from '../hooks/usePolling.js';
import { reducedMotion } from '../lib/motion.js';
import { connectScene, emitCall } from '../lib/sceneBridge.js';

const SPREAD_MS = 2600;

function supportsWebGL() {
  return Boolean(document.createElement('canvas').getContext('webgl2'));
}

function isLowPower() {
  return window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4 || navigator.connection?.saveData === true;
}

/**
 * Hosts the WebGL scene behind the page. The scene loads after first paint and only
 * upgrades the page: the CSS sky and frosted panel remain if it never starts.
 */
export function Backdrop({ refreshKey }) {
  const host = useRef(null);
  const seen = useRef(null);

  const traffic = usePolling((signal) => getLogs({ size: 50 }, signal), [refreshKey]);

  useEffect(() => {
    if (!traffic.data) return;
    const fresh = traffic.data.content.filter((entry) => !seen.current?.has(entry.requestId));
    const firstRead = seen.current === null;
    seen.current ??= new Set();
    fresh.forEach((entry) => seen.current.add(entry.requestId));
    if (firstRead) return;
    fresh.forEach((entry) => window.setTimeout(() => emitCall(entry), Math.random() * SPREAD_MS));
  }, [traffic.data]);

  useEffect(() => {
    if (!supportsWebGL()) return undefined;
    let cancelled = false;
    let dispose = () => {};

    import('../scene/createScene.js').then(({ createScene }) => {
      if (cancelled) return;
      const scene = createScene(host.current, { animate: !reducedMotion(), lowPower: isLowPower() });
      const canvas = host.current.querySelector('canvas');

      const onContextLost = (event) => {
        event.preventDefault();
        document.documentElement.classList.remove('has-glass');
        canvas.remove();
        connectScene(null);
      };
      canvas.addEventListener('webglcontextlost', onContextLost);

      connectScene(scene);
      scene.setPanel(document.getElementById('registro'));
      gsap.ticker.add(scene.frame);
      document.documentElement.classList.add('has-glass');
      gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: reducedMotion() ? 0 : 1.2, ease: 'power2.out' });

      dispose = () => {
        canvas.removeEventListener('webglcontextlost', onContextLost);
        gsap.ticker.remove(scene.frame);
        document.documentElement.classList.remove('has-glass');
        connectScene(null);
        scene.dispose();
      };
    });

    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  return <div ref={host} className="scene-host" aria-hidden="true" />;
}
