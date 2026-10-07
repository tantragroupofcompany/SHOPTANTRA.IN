'use client';

/**
 * A dashboard metric card.
 *
 * Renders as a real <button> when `onOpen` is supplied, so mouse, TOUCH, Enter
 * and Space all work and screen readers announce it as activatable. Without
 * `onOpen` it renders as a non-interactive panel, so nothing on the board looks
 * clickable unless it genuinely is (no dead affordances).
 */
import { EASE, FOCUS, TOUCH } from './theme';

export default function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  onOpen,
  detailLabel,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  /** Present => the card opens a detail panel. Absent => static panel. */
  onOpen?: () => void;
  /** Announced by screen readers, e.g. "Open seller details". */
  detailLabel?: string;
}) {
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

  if (!onOpen) {
    return (
      <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-xl p-4 sm:p-5 shadow-sm">{inner}</div>
    );
  }

  const handleOpen = () => {
    console.log('[ST_RUNTIME] CARD_TOUCH', { label });
    console.log('[ST_RUNTIME] OPEN_DETAIL', { label });
    onOpen();
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