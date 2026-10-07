'use client';

/**
 * A dashboard metric card.
 *
 * Renders as a real <button> when `onOpen` or `detailKey` is supplied, so mouse,
 * TOUCH, Enter and Space all work and screen readers announce it as activatable.
 * Without either it renders as a non-interactive panel, so nothing on the board
 * looks clickable unless it genuinely is (no dead affordances).
 *
 * WHY THE CARD RESOLVES `detailKey` ITSELF: the detail panel's context provider
 * lives in ExecutiveShell, which renders the dashboard as its children - so a
 * dashboard component sits ABOVE the provider and would read the default no-op
 * (React context only flows downward). MetricCard is always mounted inside the
 * provider, so it receives the real openDetail.
 */
import { EASE, FOCUS, TOUCH } from './theme';
import { useOpenDetail } from './ExecutiveShell';

export default function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  onOpen,
  detailKey,
  detailLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  /** Present => run an action (e.g. navigate to a full page). */
  onOpen?: () => void;
  /** Present => open the shell's real-data detail panel for this key. */
  detailKey?: string;
  /** Announced by screen readers, e.g. "Open seller details". */
  detailLabel?: string;
}) {
  // Inside <DetailContext.Provider> this is the shell's real openDetail; outside
  // a shell it is the documented no-op fallback.
  const openDetail = useOpenDetail();

  const inner = (
    <>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-brand-orange shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 break-words">{value}</p>
          {sub ? <p className="text-[11px] text-gray-400 mt-0.5 break-words">{sub}</p> : null}
        </div>
      </div>
    </>
  );

  if (!onOpen && !detailKey) {
    return (
      <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-xl p-4 sm:p-5 shadow-sm">{inner}</div>
    );
  }

  const handleOpen = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    if (detailKey) openDetail(detailKey);
  };

  return (
    <button
      type="button"
      onClick={handleOpen}
      aria-label={detailLabel || `Open ${label.toLowerCase()} details`}
      className={[
        'bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-xl p-4 sm:p-5 shadow-sm w-full text-left',
        TOUCH, EASE, FOCUS,
        'hover:border-brand-orange/40 hover:shadow-md active:scale-[0.98] cursor-pointer',
      ].join(' ')}
    >
      {inner}
    </button>
  );
}