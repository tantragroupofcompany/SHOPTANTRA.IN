/**
 * Loads the shared, already-shipped `/api/corporate/dashboard` metrics for an
 * executive session.
 *
 * WHY A HOOK: the three executive dashboards were static placeholders. The
 * `/api/corporate/dashboard` route already computed correct, production-backed
 * metrics for all three executive roles, so the fix is to CONSUME it rather
 * than add a second metrics API that would immediately drift from the first.
 *
 * SECURITY: the endpoint is guarded server-side by `requireRole`. This hook never
 * sends any credential; it relies on the HttpOnly session cookie.
 *
 * `cache: 'no-store'` is deliberate. These are live executive metrics; a cached
 * figure would keep showing a stale number after a new order or approval.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ExecutiveDashboardData } from './executiveDashboard';

export type LoadState = 'loading' | 'ready' | 'error';

export function useExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/corporate/dashboard', {
        credentials: 'include',
        cache: 'no-store',
      });

      // 401/403 mean the session is gone or the role is wrong: that is NOT a
      // metrics error and must not be rendered as an empty dashboard.
      if (res.status === 401 || res.status === 403) {
        setData(null);
        setState('error');
        setError(
          res.status === 403
            ? 'Your role does not have access to this dashboard.'
            : 'Your session has expired. Please sign in again.'
        );
        return;
      }

      const json = await res.json();

      if (!res.ok || !json?.success) {
        setData(null);
        setState('error');
        // Never surface a Prisma message, connection string or stack trace.
        setError('Unable to load dashboard data. Please try again.');
        return;
      }

      if (!json.data) {
        setData(null);
        setState('error');
        setError('Unable to load dashboard data. Please try again.');
        return;
      }

      setData(json.data as ExecutiveDashboardData);
      setState('ready');
      setError(null);
    } catch {
      setData(null);
      setState('error');
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, state, error, refreshing, reload: () => load(true) };
}