import { isRangeInvalid } from '../lib/logFilters.js';

export function LogFilters({ filters, onChange }) {
  const rangeInvalid = isRangeInvalid(filters.from, filters.to);

  function handleChange(event) {
    const { name, value } = event.target;
    onChange({ ...filters, [name]: value, page: 0 });
  }

  return (
    <div className="log-filters" aria-label="Filtros del registro">
      <label className="log-filter">
        Servicio
        <select name="service" value={filters.service} onChange={handleChange}>
          <option value="">Todos</option>
          <option value="inventory">Inventario</option>
          <option value="orders">Pedidos</option>
          <option value="payments">Pagos</option>
        </select>
      </label>
      <label className="log-filter">
        Estado
        <select name="status" value={filters.status} onChange={handleChange}>
          <option value="">Todos</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="ERROR">ERROR</option>
        </select>
      </label>
      <label className="log-filter">
        Desde
        <input
          type="datetime-local"
          name="from"
          value={filters.from}
          onChange={handleChange}
          aria-invalid={rangeInvalid}
        />
      </label>
      <label className="log-filter">
        Hasta
        <input
          type="datetime-local"
          name="to"
          value={filters.to}
          onChange={handleChange}
          aria-invalid={rangeInvalid}
        />
      </label>
      {rangeInvalid && (
        <p className="inline-error log-range-error" role="alert">
          La fecha inicial debe ser anterior a la final.
        </p>
      )}
    </div>
  );
}
