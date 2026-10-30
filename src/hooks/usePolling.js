import { useEffect, useRef, useState } from 'react';

export const POLL_INTERVAL_MS = 3000;

/**
 * Calls fetcher(signal) on load and every interval after the previous call settles, so
 * requests never overlap. Changing deps aborts the call in flight, which drops stale
 * responses. Hidden tabs skip the call.
 */
export function usePolling(fetcher, deps = [], intervalMs = POLL_INTERVAL_MS) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const latestFetcher = useRef(fetcher);
  latestFetcher.current = fetcher;

  useEffect(() => {
    let active = true;
    let timer = null;
    const controller = new AbortController();

    async function tick() {
      if (!document.hidden) {
        try {
          const data = await latestFetcher.current(controller.signal);
          if (active) setState({ data, error: null, loading: false });
        } catch (error) {
          if (active && error.name !== 'AbortError') {
            setState((current) => ({ ...current, error: error.message, loading: false }));
          }
        }
      }
      if (active) timer = setTimeout(tick, intervalMs);
    }

    setState((current) => ({ ...current, loading: current.data === null }));
    tick();
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [...deps, intervalMs]);

  return state;
}
