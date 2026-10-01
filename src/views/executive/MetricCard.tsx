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
          <p className="text-xs text-gray-300">{label}</p>
          <p className="text-lg sm:text-xl font-bold text-white break-words">{value}</p>
          {sub ? <p className="text-[11px] text-gray-400 mt-0.5 break-words">{sub}</p> : null}
        </div>
      </div>
    </>
  );

  if (!onOpen) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">{inner}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={detailLabel || `Open ${label.toLowerCase()} details`}
      className={[
        'bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 w-full text-left',
        TOUCH, EASE, FOCUS,
        'hover:bg-white/10 hover:border-brand-orange/40 active:scale-[0.98] cursor-pointer',
      ].join(' ')}
    >
      {inner}
    </button>
  );
}