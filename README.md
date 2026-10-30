# Punto de control

Dashboard for the Proxy pattern microservice monitor. Shows the calls that cross the logging proxy, updated every 3 seconds.

React, Vite, Recharts and GSAP. All backend calls live in `src/api/metricsApi.js`, and `usePolling` keeps one request at a time per view.

```bash
npm install
npm test
VITE_API_URL=http://localhost:8080 npm run dev
```
