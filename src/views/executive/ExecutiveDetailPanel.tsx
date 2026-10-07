'use client';

/**
 * Slide-in detail panel used by every interactive dashboard card.
 *
 * WHY A PANEL: the executive dashboards are a summary board, so a card opens the
 * underlying RECORDS rather than navigating away and losing the board's context.
 * It is driven entirely by an existing, role-guarded API - it never fabricates a
 * row and never receives a credential.
 *
 * BEHAVIOUR
 *  - Desktop: slides in from the right over a dimmed backdrop.
 *  - Mobile: full-width sheet.
 *  - Closes on the X button, a backdrop click, or the Escape key.
 *  - While open, focus moves into the panel and the page behind cannot scroll.
 *
 * STATES (each is explicit - a failure is never rendered as an empty list)
 *  loading  -> skeleton rows, no values
 *  error    -> "Unable to load this data. Please try again." + retry
 *  empty    -> "No data available"
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Inbox, RefreshCw, X, ExternalLink } from 'lucide-react';
import { EASE, FOCUS, TOUCH } from './theme';

export interface DetailColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Hide on narrow screens to keep the table readable. */
  secondary?: boolean;
}

export interface DetailRequest {
  /** Existing, role-guarded endpoint. */
  url: string;
  title: string;
  description?: string;
  columns: DetailColumn<any>[];
  /** Optional filter chips, e.g. order status. */
  filters?: { id: string; label: string; value: string }[];
  /**
   * Query-string parameter the chip value is sent as. Every corporate detail
   * endpoint reads `status`, and the finance endpoint additionally reads `view`,
   * so this defaults to `status`.
   */
  filterParam?: string;
  /** Path in the response holding the row array. Defaults to `items`. */
  itemsKey?: string;
}

function Skeleton() {
  return (
    <div className="p-4 space-y-2" aria-hidden="true">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 rounded-lg bg-gray-200 dark:bg-brand-navy-light/20 animate-pulse" />
      ))}
    </div>
  );
}

export default function ExecutiveDetailPanel({
  request,
  onClose,
}: {
  request: DetailRequest | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter] = useState('all');
  const [nonce, setNonce] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = !!request;

  // Determine if this is an approval-related detail view that should have a "View Full Approval Center" button
  const isApprovalView = request?.url === '/api/corporate/sellers' || request?.url === '/api/corporate/products';
  const approvalCenterUrl = request?.url === '/api/corporate/sellers' ? '/corporate/sellers' : '/corporate/products';

  // Escape closes; body scroll is locked while the panel is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Reset whenever a different card is opened.
  useEffect(() => {
    if (!request) return;
    setData(null);
    setState('loading');
    setFilter(request.filters?.[0]?.value ?? 'all');
  }, [request]);

  // Fetch. `no-store` keeps the detail live rather than cached.
  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    // Build the filtered URL.
    // Every corporate detail endpoint reads `?status=` for the chip value, and
    // some builder URLs already carry a query string (e.g. `?view=payments`), so
    // the separator has to be `&` in that case. The previous code sent
    // `?view=<value>` (the wrong parameter name for the list endpoints) and
    // produced a malformed `...?view=payments?view=paid` URL for the finance
    // views, so every filter chip silently returned unfiltered data.
    const filterParam = request.filterParam || 'status';
    const url =
      filter === 'all'
        ? request.url
        : `${request.url}${request.url.includes('?') ? '&' : '?'}${filterParam}=${encodeURIComponent(filter)}`;
    (async () => {
      try {
        const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          setState('error');
          setData(null);
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok || !json?.success || !json.data) {
          setState('error');
          setData(null);
          return;
        }
        setData(json.data);
        setState('ready');
      } catch {
        if (!cancelled) {
          setState('error');
          setData(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [request, filter, nonce]);

  const items: any[] = (request && data?.[request.itemsKey ?? 'items']) || [];
  const totals = data?.totals;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm',
          EASE,
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={request?.title || 'Details'}
        className={[
          'fixed z-50 bg-white dark:bg-brand-navy border-l border-gray-100 dark:border-brand-navy-light/10 flex flex-col',
          'inset-y-0 right-0 w-full sm:w-[min(46rem,92vw)]',
          EASE,
          open ? 'translate-x-0 shadow-2xl' : 'translate-x-full pointer-events-none',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-brand-navy-light/10">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{request?.title}</h2>
            {request?.description ? (
              <p className="text-xs text-gray-400 mt-0.5">{request.description}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isApprovalView && (
              <button
                type="button"
                onClick={() => { onClose(); navigate(approvalCenterUrl); }}
                aria-label="Open full approval center"
                className={`${TOUCH} px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-orange text-white hover:bg-brand-orange-hover transition flex items-center gap-1.5 ${EASE} ${FOCUS}`}
              >
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                Approval Center
              </button>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className={`${TOUCH} shrink-0 px-3 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 ${EASE} ${FOCUS}`}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {request?.filters?.length ? (
          <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-2 border-b border-gray-100 dark:border-brand-navy-light/10">
            {request.filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={[
                  'px-3 rounded-full text-xs font-medium border min-h-[32px]',
                  EASE, FOCUS,
                  filter === f.value
                    ? 'bg-brand-orange text-white border-brand-orange'
                    : 'text-gray-600 border-gray-200 dark:border-brand-navy-light/30 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-800 dark:text-gray-200',
                ].join(' ')}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              aria-label="Reload data"
              className={`ml-auto px-3 rounded-lg text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-brand-navy-light/30 ${EASE} ${FOCUS} min-h-[32px]`}
            >
              <RefreshCw className="w-3.5 h-3.5 inline" aria-hidden="true" /> Refresh
            </button>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto">
          {state === 'loading' ? <Skeleton /> : null}

          {state === 'error' ? (
            <div role="alert" className="m-4 p-4 rounded-lg bg-red-500/10 border border-red-400/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Unable to load this data. Please try again.</p>
                <button
                  type="button"
                  onClick={() => setNonce((n) => n + 1)}
                  className={`mt-3 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-800 ${EASE} ${FOCUS}`}
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" /> Try again
                </button>
              </div>
            </div>
          ) : null}

          {state === 'ready' && !items.length ? (
            <div className="p-10 text-center text-gray-400">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" aria-hidden="true" />
              <p className="text-sm">No data available</p>
            </div>
          ) : null}

          {state === 'ready' && items.length ? (
            <>
              <div className="px-4 sm:px-6 py-3 text-xs text-gray-400 border-b border-gray-100 dark:border-brand-navy-light/10">
                {typeof data?.total === 'number'
                  ? `${data.total} record${data.total === 1 ? '' : 's'}`
                  : `${items.length} shown`}
              </div>
              {/* Wide screens: table. Narrow screens: stacked cards. */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                      {request!.columns.map((c) => (
                        <th key={c.key} className="px-4 sm:px-6 py-3 font-semibold whitespace-nowrap">
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row: any, i: number) => (
                      <tr key={row?.id ?? i} className="border-t border-gray-100 dark:border-brand-navy-light/10 hover:bg-gray-50 dark:hover:bg-brand-navy-light/20">
                        {request!.columns.map((c) => (
                          <td key={c.key} className="px-4 sm:px-6 py-3 text-gray-800 dark:text-gray-200 align-top">
                            {c.render(row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="sm:hidden divide-y divide-gray-100 dark:divide-brand-navy-light/10">
                {items.map((row: any, i: number) => (
                  <li key={row?.id ?? i} className="p-4 space-y-1.5">
                    {request!.columns
                      .filter((c) => !c.secondary)
                      .map((c) => (
                        <div key={c.key} className="flex justify-between gap-3 text-sm">
                          <span className="text-gray-400 shrink-0">{c.header}</span>
                          <span className="text-gray-800 dark:text-gray-200 text-right break-words">{c.render(row)}</span>
                        </div>
                      ))}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        {totals ? (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-100 dark:border-brand-navy-light/10 text-xs text-gray-400">
            {Object.entries(totals).map(([k, v]) => (
              <span key={k} className="mr-4">
                {k}: <span className="text-gray-800 dark:text-gray-200 font-semibold">{String(v)}</span>
              </span>
            ))}
          </div>
        ) : null}
      </aside>
    </>
  );
}
