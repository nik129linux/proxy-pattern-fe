import { useEffect, useRef, useState } from 'react';
import { getLogs } from '../api/metricsApi.js';
import { usePolling } from '../hooks/usePolling.js';
import { isRangeInvalid, toQuery } from '../lib/logFilters.js';
import { rowDrop } from '../lib/motion.js';
import { hoverRow } from '../lib/sceneBridge.js';
import { LogFilters } from './LogFilters.jsx';
import { LogRow } from './LogRow.jsx';

const INITIAL_FILTERS = { service: '', status: '', from: '', to: '', page: 0 };
const EMPTY_PAGE = { content: [], page: 0, size: 15, totalElements: 0, totalPages: 0 };

export function LogBoard({ refreshKey }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const seenRequestIds = useRef(new Set());
  const hasLoadedRows = useRef(false);
  const rowElements = useRef(new Map());
  const rangeInvalid = isRangeInvalid(filters.from, filters.to);

  const { data, error, loading } = usePolling(async (signal) => {
    if (rangeInvalid) return { ...EMPTY_PAGE, page: filters.page };
    return getLogs({ ...toQuery(filters), size: 15 }, signal);
  }, [filters, refreshKey]);

  useEffect(() => {
    if (!data) return;
    const ids = data.content.map((entry) => entry.requestId);

    if (!hasLoadedRows.current) {
      ids.forEach((id) => seenRequestIds.current.add(id));
      hasLoadedRows.current = true;
      return;
    }

    const newIds = ids.filter((id) => !seenRequestIds.current.has(id));
    ids.forEach((id) => seenRequestIds.current.add(id));
    const newRowElements = newIds.map((id) => rowElements.current.get(id)).filter(Boolean);
    rowDrop(newRowElements);
  }, [data]);

  function toggleRow(requestId) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(requestId)) next.delete(requestId);
      else next.add(requestId);
      return next;
    });
  }

  function registerRow(requestId, element) {
    if (element) rowElements.current.set(requestId, element);
    else rowElements.current.delete(requestId);
  }

  const page = data ?? EMPTY_PAGE;
  const totalPages = Math.max(page.totalPages, 1);

  return (
    <section id="registro" className="ink-panel log-board" aria-labelledby="logs-title">
      <h2 id="logs-title" className="section-title">Registro en vivo</h2>
      <LogFilters filters={filters} onChange={setFilters} />
      {error && (
        <p className="inline-error" role="alert">
          No pudimos leer el registro. {error} Reintentamos en 3 segundos.
        </p>
      )}
      <div className="log-table-wrap" data-lenis-prevent-touch>
        <table className="log-table">
          <thead>
            <tr>
              <th scope="col">requestId</th>
              <th scope="col">servicio</th>
              <th scope="col">operación</th>
              <th scope="col">duración</th>
              <th scope="col">estado</th>
            </tr>
          </thead>
          <tbody
            onPointerOver={(event) => hoverRow(event.target.closest('.log-row'))}
            onPointerLeave={() => hoverRow(null)}
          >
            {loading && !data ? Array.from({ length: 5 }, (_, rowIndex) => (
              <tr className="log-skeleton-row service-card-skeleton" aria-hidden="true" key={rowIndex}>
                {Array.from({ length: 5 }, (_, cellIndex) => (
                  <td key={cellIndex}><span className="log-skeleton-line" /></td>
                ))}
              </tr>
            )) : page.content.length === 0 ? (
              <tr>
                <td className="log-empty" colSpan={5}>Ninguna llamada coincide con estos filtros.</td>
              </tr>
            ) : page.content.map((entry) => (
              <LogRow
                key={entry.requestId}
                entry={entry}
                expanded={expandedIds.has(entry.requestId)}
                onToggle={() => toggleRow(entry.requestId)}
                rowRef={(element) => registerRow(entry.requestId, element)}
              />
            ))}
          </tbody>
        </table>
      </div>
      <nav className="log-pagination" aria-label="Paginación del registro">
        <button
          type="button"
          className="log-page-button"
          disabled={page.page <= 0 || rangeInvalid}
          onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
        >
          Anterior
        </button>
        <span className="log-page-status">Página {page.page + 1} de {totalPages}</span>
        <button
          type="button"
          className="log-page-button"
          disabled={page.page + 1 >= page.totalPages || rangeInvalid}
          onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
        >
          Siguiente
        </button>
      </nav>
    </section>
  );
}
