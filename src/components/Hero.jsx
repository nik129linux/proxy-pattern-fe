import { useEffect, useRef } from 'react';
import { heroIn } from '../lib/motion.js';

export function Hero({ onSimulate, running, status }) {
  const root = useRef(null);

  useEffect(() => {
    heroIn(root.current.querySelectorAll('.hero-line > span'));
  }, []);

  return (
    <header ref={root} className="hero">
      <h1 aria-label="Punto de control">
        <span className="hero-line" aria-hidden="true"><span>Punto de</span></span>
        <span className="hero-line" aria-hidden="true"><span>control</span></span>
      </h1>
      <div className="hero-bar">
        <p className="hero-lede">
          Cada llamada a Inventario, Pedidos y Pagos cruza este proxy antes de llegar al servicio.
          Aquí queda su registro, con duración, estado y error.
        </p>
        <div className="hero-action">
          <button type="button" className="button-load" onClick={onSimulate} disabled={running}>
            {running ? 'Enviando 50 llamadas' : 'Simular carga'}
          </button>
          <p className="hero-status" role="status">{status}</p>
        </div>
      </div>
      <div className={running ? 'barrier is-running' : 'barrier'} aria-hidden="true" />
    </header>
  );
}
