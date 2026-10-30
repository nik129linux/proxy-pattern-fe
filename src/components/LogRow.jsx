import { useId } from 'react';
import { formatMs, serviceLabel } from '../lib/format.js';

const timestampFormatter = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'long',
});

function prettyJson(value) {
  return JSON.stringify(value, null, 2) ?? 'null';
}

export function LogRow({ entry, expanded, onToggle, rowRef }) {
  const detailsId = useId();

  function handleRowKeyDown(event) {
    if (event.target !== event.currentTarget || event.repeat) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  }

  function handleButtonClick(event) {
    event.stopPropagation();
    onToggle();
  }

  return (
    <>
      <tr
        ref={rowRef}
        className={expanded ? 'log-row is-expanded' : 'log-row'}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={handleRowKeyDown}
      >
        <th scope="row">
          <button
            type="button"
            className="log-request-button log-data"
            title={entry.requestId}
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={expanded ? 'Ocultar detalles de la llamada' : 'Mostrar detalles de la llamada'}
            onClick={handleButtonClick}
          >
            {entry.requestId.slice(0, 8)}
          </button>
        </th>
        <td>{serviceLabel(entry.serviceId)}</td>
        <td>{entry.operation}</td>
        <td className="log-data">{formatMs(entry.durationMs)}</td>
        <td>
          {entry.status === 'ERROR'
            ? <span className="log-status-error">ERROR</span>
            : entry.status}
        </td>
      </tr>
      <tr className="log-details-row" aria-hidden={!expanded}>
        <td colSpan={5}>
          <div id={detailsId} className={expanded ? 'log-details is-expanded' : 'log-details'}>
            <div className="log-details-inner">
              <div className="log-details-content">
                <dl className="log-meta">
                  <div>
                    <dt>requestId completo</dt>
                    <dd className="log-data log-request-full">{entry.requestId}</dd>
                  </div>
                  <div>
                    <dt>Fecha y hora</dt>
                    <dd className="log-data">
                      <time dateTime={entry.timestamp}>
                        {timestampFormatter.format(new Date(entry.timestamp))}
                      </time>
                    </dd>
                  </div>
                </dl>
                <div className="log-json-grid">
                  <section className="log-json-block" aria-labelledby={`${detailsId}-params`}>
                    <h3 id={`${detailsId}-params`}>Parámetros</h3>
                    <pre className="log-json" tabIndex={0}>{prettyJson(entry.params)}</pre>
                  </section>
                  <section className="log-json-block" aria-labelledby={`${detailsId}-response`}>
                    <h3 id={`${detailsId}-response`}>Respuesta</h3>
                    <pre className="log-json" tabIndex={0}>{prettyJson(entry.response)}</pre>
                  </section>
                </div>
                {entry.status === 'ERROR' && (
                  <div className="log-error-details">
                    <p><strong>Tipo de error:</strong> {entry.errorType}</p>
                    <p><strong>Mensaje de error:</strong> {entry.errorMessage}</p>
                    <p><strong>Resumen de la pila:</strong> {entry.stackSummary}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
