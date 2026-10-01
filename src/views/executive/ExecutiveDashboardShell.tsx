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

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white/10 rounded-xl p-5 border border-white/10">
      <div className="flex items-center gap-3">
        <Icon className="w-6 h-6 text-brand-orange shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-gray-300">{label}</p>
          <p className="text-xl font-bold break-words">{value}</p>
          {sub ? <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p> : null}
        </div>
      </div>
    </div>
  );
}

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
            <p className="text-gray-300 text-sm mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {state === 'ready' ? (
              <button
                onClick={reload}
                disabled={refreshing}
                className="inline-flex items-center gap-2 text-sm text-gray-200 hover:text-white disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing' : 'Refresh'}
              </button>
            ) : null}
            <button onClick={onBack} className="text-sm text-gray-200 hover:text-white">
              Back to site
            </button>
          </div>
        </header>

        {state === 'loading' ? <LoadingSkeleton /> : null}

        {state === 'error' ? (
          <div role="alert" className="bg-red-500/10 border border-red-400/30 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200">{error}</p>
              <button onClick={reload} className="mt-3 inline-flex items-center gap-2 text-sm text-red-200 hover:text-white">
                <RefreshCw className="w-4 h-4" /> Try again
              </button>
            </div>
          </div>
        ) : null}

        {state === 'ready' && data ? children(data) : null}
      </div>
    </div>
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