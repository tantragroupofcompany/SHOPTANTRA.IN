/**
 * Shared shell for the Founder / Chairman / CEO & MD dashboards.
 *
 * Previously each of these three screens was a standalone placeholder rendering
 * an em dash and "Connect backend APIs to populate live metrics". They now all
 * render real metrics from `/api/corporate/dashboard`, and differ only in WHICH
 * sections their role is shown - the role gate itself is still enforced
 * server-side by `requireRole` and by FounderGuard/CEOGuard/ChairmanGuard.
 *
 * States are explicit: a loading skeleton while fetching, an error panel when the
 * API fails, and real "0" / "No data yet" only when the database genuinely has no
 * rows. A failed request never renders as zeroes.
 */
import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useExecutiveDashboard } from '../../lib/useExecutiveDashboard';
import ExecutiveShell from './ExecutiveShell';

/* MetricCard now lives in its own module (./MetricCard) and is interactive:
   it renders a real <button> when a detail view exists. */

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white/10 rounded-xl p-6 border border-white/10">
      <h2 className="font-bold text-lg mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-300">{label}</span>
      <span className="text-sm font-semibold text-white text-right break-words">{value}</span>
    </div>
  );
}

/** Renders [label, value] pairs as rows. */
export function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <div>
      {rows.map(([label, value]) => (
        <StatRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}

/**
 * List-backed section with a genuine empty state. The empty text is only shown
 * when the database really returned no rows - never to paper over a failed fetch,
 * because a failed fetch renders the error panel instead of this component.
 */
export function ListSection({
  title, rows, empty,
}: { title: string; rows: any[] | undefined; empty: string }) {
  const list = Array.isArray(rows) ? rows : [];
  return (
    <Section title={title}>
      {list.length ? (
        <div className="space-y-2">
          {list.map((r, i) => (
            <StatRow key={r?.id ?? r?.month ?? i} label={r?.label} value={r?.value} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400">{empty}</p>
      )}
    </Section>
  );
}
function LoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading dashboard metrics</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white/10 rounded-xl p-5 border border-white/10 animate-pulse">
            <div className="h-3 w-20 bg-white/10 rounded mb-3" />
            <div className="h-6 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white/10 rounded-xl p-6 border border-white/10 animate-pulse">
        <div className="h-5 w-48 bg-white/10 rounded mb-4" />
        <div className="h-32 w-full bg-white/5 rounded" />
      </div>
    </div>
  );
}

export default function ExecutiveDashboardShell({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: (data: any) => ReactNode;
}) {
  const { data, state, error, refreshing, reload } = useExecutiveDashboard();

  // Sign out goes through the server endpoint: the corporate cookies are
  // HttpOnly, so `document.cookie` cannot clear them.
  const signOut = async () => {
    try {
      await fetch('/api/corporate/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* the server call is what matters */
    }
    window.location.href = '/corporate-access';
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <LoadingSkeleton />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
        <div
          role="alert"
          className="max-w-2xl mx-auto mt-16 bg-red-500/10 border border-red-400/30 rounded-xl p-6 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h1 className="text-lg font-bold text-red-200">{title}</h1>
            <p className="text-sm text-red-200/90 mt-1">{error}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={reload}
                className="inline-flex items-center gap-2 text-sm text-red-200 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again
              </button>
              <button onClick={onBack} className="text-sm text-gray-300 hover:text-white">
                Back to site
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ExecutiveShell
      title={title}
      subtitle={subtitle}
      role={title.replace(' Dashboard', '')}
      /* Reached only when `state === 'ready'`: the loading and error branches
         above already returned. `loading` was previously referenced as a free
         variable here (TS2304: Cannot find name 'loading'), which threw a
         ReferenceError while rendering and took down all three executive
         dashboards (they share this shell). */
      loading={false}
      refreshing={refreshing}
      onRefresh={reload}
      onSignOut={signOut}
    >
      {data ? children(data) : null}
    </ExecutiveShell>
  );
}

/** Revenue-by-month bar list, with a genuine empty state. */
export function RevenueByMonth({ rows }: { rows: { month: string; revenue: number }[] }) {
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) return <p className="text-sm text-gray-400">No revenue recorded yet.</p>;
  const max = Math.max(...list.map((r) => Number(r.revenue || 0)), 1);
  return (
    <div className="space-y-2">
      {list.map((r) => (
        <div key={r.month} className="flex items-center gap-3">
          <span className="text-xs text-gray-300 w-16 shrink-0">{r.month}</span>
          <div className="flex-1 h-2 rounded bg-white/5 overflow-hidden">
            <div className="h-full bg-brand-orange" style={{ width: `${Math.max((Number(r.revenue || 0) / max) * 100, 2)}%` }} />
          </div>
          <span className="text-xs text-gray-200 w-24 text-right shrink-0">{Number(r.revenue || 0).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
}