import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getLogs } from '../api/metricsApi.js';
import { usePolling } from '../hooks/usePolling.js';
import { formatMs, SERVICE_IDS, serviceLabel } from '../lib/format.js';

const axisText = {
  fill: 'var(--color-bone-dim)',
  fontFamily: 'var(--font-data)',
  fontSize: 'var(--data-sm)',
};

function ServiceEndLabel({ index, x, y, lastIndex, label }) {
  if (index !== lastIndex || x === undefined || y === undefined) return null;
  return (
    <text className="chart-end-label" x={x + 8} y={y} dominantBaseline="middle">
      {label}
    </text>
  );
}

function LatencyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const values = payload.filter((item) => item.value !== null && item.value !== undefined);
  if (values.length === 0) return null;

  return (
    <div className="chart-tooltip">
      <p>Llamada {label}</p>
      <dl>
        {values.map((item) => (
          <div key={item.name}>
            <dt>{item.name}</dt>
            <dd>{formatMs(item.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function LatencyChart({ refreshKey }) {
  const { data, error, loading } = usePolling(
    (signal) => Promise.all(SERVICE_IDS.map((service) => getLogs({ service, size: 20 }, signal))),
    [refreshKey],
  );

  const series = SERVICE_IDS.map((service, serviceIndex) => {
    const points = [...(data?.[serviceIndex]?.content ?? [])]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((entry, position) => ({ position: position + 1, durationMs: entry.durationMs }));
    return { service, points };
  });
  const pointCount = Math.max(0, ...series.map((item) => item.points.length));
  const chartData = Array.from({ length: pointCount }, (_, index) => ({ position: index + 1 }));
  const hasLogs = pointCount > 0;

  return (
    <section className="ink-panel latency-panel" aria-labelledby="latency-title">
      <h2 id="latency-title" className="section-title">Últimas 20 llamadas por servicio</h2>
      <ul className="chart-legend" aria-label="Servicios">
        {SERVICE_IDS.map((service) => (
          <li key={service}>
            <span className={`chart-legend-mark series-${service}`} aria-hidden="true" />
            {serviceLabel(service)}
          </li>
        ))}
      </ul>
      {error && (
        <p className="inline-error" role="alert">
          No pudimos leer las latencias. {error} Reintentamos en 3 segundos.
        </p>
      )}
      {loading && !data ? (
        <div className="chart-loading service-card-skeleton" aria-hidden="true" />
      ) : hasLogs ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 96, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="var(--color-ink-line)" vertical={false} />
              <XAxis
                dataKey="position"
                type="number"
                domain={[1, 20]}
                allowDecimals={false}
                stroke="var(--color-ink-line)"
                tick={axisText}
                tickLine={false}
              />
              <YAxis
                width={64}
                stroke="var(--color-ink-line)"
                tick={axisText}
                tickLine={false}
                tickFormatter={formatMs}
              />
              <Tooltip
                content={<LatencyTooltip />}
                cursor={{ stroke: 'var(--color-bone-dim)', strokeWidth: 1 }}
              />
              {series.map(({ service, points }) => (
                <Line
                  key={service}
                  data={points}
                  dataKey="durationMs"
                  name={serviceLabel(service)}
                  stroke={`var(--series-${service})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  label={(props) => (
                    <ServiceEndLabel
                      {...props}
                      lastIndex={points.length - 1}
                      label={serviceLabel(service)}
                    />
                  )}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="chart-empty">Aún no hay llamadas. Pulsa Simular carga para poblar el tablero.</p>
      )}
    </section>
  );
}
