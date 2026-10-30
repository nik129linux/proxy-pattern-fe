import { useEffect, useRef } from 'react';
import { formatCount, formatMs, formatPercent, isDegraded, serviceLabel } from '../lib/format.js';
import { alarmFlip } from '../lib/motion.js';
import { FlapNumber } from './FlapNumber.jsx';

export function ServiceCard({ metrics }) {
  const degraded = isDegraded(metrics.errorRate);
  const card = useRef(null);
  const wasDegraded = useRef(degraded);

  useEffect(() => {
    if (degraded && !wasDegraded.current) alarmFlip(card.current);
    wasDegraded.current = degraded;
  }, [degraded]);

  return (
    <article ref={card} className={degraded ? 'service-card is-alarm' : 'service-card'} data-service={metrics.serviceId} data-degraded={degraded}>
      <header className="service-card-head">
        <h3>{serviceLabel(metrics.serviceId)}</h3>
        {degraded && <p className="service-card-alarm">Con problemas: {formatPercent(metrics.errorRate)} de error</p>}
      </header>
      <div className="service-card-total">
        <FlapNumber value={formatCount(metrics.totalCalls)} />
        <p>llamadas</p>
      </div>
      <dl className="service-card-stats">
        <div>
          <dt>Tasa de éxito</dt>
          <dd>{metrics.totalCalls === 0 ? 'Sin datos' : formatPercent(metrics.successRate)}</dd>
        </div>
        <div>
          <dt>Tiempo promedio</dt>
          <dd>{metrics.totalCalls === 0 ? 'Sin datos' : formatMs(metrics.averageDurationMs)}</dd>
        </div>
      </dl>
    </article>
  );
}

export function ServiceCardSkeleton() {
  return <div className="service-card service-card-skeleton" aria-hidden="true" />;
}
