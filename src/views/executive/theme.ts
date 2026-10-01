/**
 * The three executive dashboards (Founder, Chairman, CEO & MD) share one visual
 * system: a left navigation rail, a header, and a slide-in detail panel.
 *
 * Previously each dashboard was a bare grid of text with no navigation and no way
 * to drill into a number. This module supplies the shared design system so all
 * three stay consistent, while `ExecutiveShell` still scopes the menu to the
 * signed-in role.
 *
 * MOTION
 * ------
 * Transitions are 150-300ms CSS transitions on purpose. No animation library is
 * added: the project ships Tailwind, and a dependency for a sidebar is not
 * justified.
 *
 * `prefers-reduced-motion` is honoured via the `motion-reduce:` variants, so a
 * user who asks for reduced motion gets the same layout with effectively no
 * animation. Focus rings use the brand orange rather than the browser default
 * blue, while remaining clearly visible (accessibility is not removed, only
 * restyled).
 */

export const EASE = 'transition-all duration-200 ease-out';

/** Brand focus ring, used everywhere instead of the browser's blue default. */
export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900';

/** Minimum comfortable touch target. */
export const TOUCH = 'min-h-[44px]';

/** Card shell. Interactive cards extend this with press feedback. */
export const CARD = 'bg-white/5 border border-white/10 rounded-xl';

/** Interactive card: hover lift + press feedback, all keyboard/touch reachable. */
export const CARD_ACTION = `${CARD} ${EASE} hover:bg-white/10 hover:border-brand-orange/40 active:scale-[0.98] cursor-pointer ${FOCUS}`;

/** A non-interactive stat panel (no cursor, no press effect). */
export const CARD_STATIC = `${CARD} ${EASE}`;
