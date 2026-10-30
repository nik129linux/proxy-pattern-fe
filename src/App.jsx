import { useEffect, useRef, useState } from 'react';
import { getSummary, simulateLoad } from './api/metricsApi.js';
import { Backdrop } from './components/Backdrop.jsx';
import { Footer } from './components/Footer.jsx';
import { Hero } from './components/Hero.jsx';
import { LatencyChart } from './components/LatencyChart.jsx';
import { LogBoard } from './components/LogBoard.jsx';
import { NotFound } from './components/NotFound.jsx';
import { ServiceCard, ServiceCardSkeleton } from './components/ServiceCard.jsx';
import { SERVICE_IDS } from './lib/format.js';
import { usePolling } from './hooks/usePolling.js';
import { pulseGate } from './lib/sceneBridge.js';
import { startSmoothScroll } from './lib/smoothScroll.js';

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Actualiza cada 3 segundos.');
  const summary = usePolling(getSummary, [refreshKey]);
  const scroller = useRef(null);

  useEffect(() => {
    scroller.current = startSmoothScroll();
    return () => scroller.current.stop();
  }, []);

  async function handleSimulate() {
    setRunning(true);
    pulseGate();
    try {
      const result = await simulateLoad();
      setStatus(`${result.generated} llamadas enviadas: ${result.success} exitosas, ${result.error} con error.`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setStatus(`No se pudo simular la carga. ${error.message}`);
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">Saltar al tablero</a>
      <Backdrop refreshKey={refreshKey} />
      <Hero onSimulate={handleSimulate} onViewLogs={() => scroller.current.scrollTo('#registro')} running={running} status={status} />
      <main id="main">
        <section className="services" aria-labelledby="services-title">
          <h2 id="services-title" className="section-title">Servicios</h2>
          {summary.error && (
            <p className="inline-error" role="alert">
              No pudimos leer las métricas. {summary.error} Reintentamos en 3 segundos.
            </p>
          )}
          <div className="service-grid">
            {summary.data
              ? summary.data.services.map((metrics, index) => <ServiceCard key={metrics.serviceId} metrics={metrics} index={index} />)
              : SERVICE_IDS.map((id) => <ServiceCardSkeleton key={id} />)}
          </div>
        </section>
        <LatencyChart refreshKey={refreshKey} />
        <LogBoard refreshKey={refreshKey} />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return window.location.pathname === '/' ? <Dashboard /> : <NotFound />;
}
