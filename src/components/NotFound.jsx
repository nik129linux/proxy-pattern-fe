export function NotFound() {
  return (
    <main className="not-found">
      <h1 className="not-found-code">404</h1>
      <p className="not-found-message">Esta ruta no pasa por el punto de control.</p>
      <a className="not-found-link" href="/">Volver al tablero</a>
    </main>
  );
}
