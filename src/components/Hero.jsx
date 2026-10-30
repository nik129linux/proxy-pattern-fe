import { useEffect, useRef } from 'react';
import { heroDrift, heroIn } from '../lib/motion.js';

export function Hero({ onSimulate, running, status }) {
  const copy = useRef(null);

  useEffect(() => {
    heroIn(copy.current.querySelectorAll('.hero-line > span'));
    return heroDrift(copy.current);
  }, []);

  return (
    <header className="hero">
      <div className={running ? 'sky is-running' : 'sky'} aria-hidden="true" />
      <div ref={copy} className="hero-copy">
        <h1 aria-label="Punto de control">
          <span className="hero-line" aria-hidden="true"><span>Punto de control</span></span>
        </h1>
        <p className="hero-lede">
          Cada llamada a Inventario, Pedidos y Pagos cruza este proxy antes de llegar al servicio.
          Aquí queda su registro, con duración, estado y error.
        </p>
        <div className="hero-actions">
          <button type="button" className="button-load" onClick={onSimulate} disabled={running}>
            {running ? 'Enviando 50 llamadas' : 'Simular carga'}
          </button>
          <a className="button-ghost" href="#registro">Ver registro</a>
        </div>
        <p className="hero-status" role="status">{status}</p>
      </div>
    </header>
  );
}
