/**
 * Animated left navigation rail for the executive dashboards.
 *
 * Desktop: a fixed rail that collapses to icons only, with a smooth width
 * transition and tooltips in the collapsed state.
 * Mobile/tablet: an off-canvas drawer with a scrim, closed by selecting an item,
 * pressing Escape, or tapping outside.
 *
 * ACCESSIBILITY
 *  - Every entry is a real <button>, so Enter and Space work without extra key
 *    handling and it is announced correctly.
 *  - The active entry carries aria-current="page" and a visible left indicator.
 *  - The mobile drawer is marked aria-modal and labelled.
 *  - Background scrolling is locked while the mobile drawer is open.
 *
 * Items are supplied by the caller and are already filtered to the role, so the
 * rail never renders a destination the executive cannot use.
 */
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { EASE, FOCUS, TOUCH } from './theme';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Optional count badge, e.g. approvals awaiting review. */
  badge?: number;
  disabled?: boolean;
}

export default function ExecutiveSidebar({
  items,
  activeId,
  onSelect,
  roleLabel,
}: {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  roleLabel: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  // Stop the page scrolling behind the drawer, and restore it on close.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const width = collapsed ? 'lg:w-20' : 'lg:w-64';
  const showLabels = !collapsed;

  const renderItems = (onPick: (id: string) => void) =>
    items.map((item) => {
      const Icon = item.icon;
      const active = item.id === activeId;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onPick(item.id)}
          disabled={item.disabled}
          aria-current={active ? 'page' : undefined}
          title={collapsed ? item.label : undefined}
          className={[
            'relative w-full flex items-center gap-3 rounded-lg px-3 text-sm',
            TOUCH, EASE, FOCUS,
            active
              ? 'bg-orange-500 text-white font-medium'
              : 'text-gray-300 hover:text-white hover:bg-white/10',
            item.disabled ? 'opacity-40 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <span
            aria-hidden="true"
            className={[
              'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r bg-brand-orange',
              EASE,
              active ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-50',
            ].join(' ')}
          />
          <Icon className={['w-5 h-5 shrink-0', active ? 'text-brand-orange' : ''].join(' ')} aria-hidden="true" />
          <span className={['truncate', showLabels ? 'block' : 'lg:hidden'].join(' ')}>{item.label}</span>
          {typeof item.badge === 'number' && item.badge > 0 ? (
            <span className={['ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-orange text-white', showLabels ? '' : 'lg:hidden'].join(' ')}>
              {item.badge}
            </span>
          ) : null}
        </button>
      );
    });


  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-[#1B3A6B]/95 backdrop-blur border-b border-white/10">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={mobileOpen}
          className={`${TOUCH} px-3 rounded-lg text-gray-200 hover:text-white hover:bg-white/10 ${EASE} ${FOCUS}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <span className="font-bold text-sm truncate">{roleLabel}</span>
      </div>

      {/* Mobile scrim */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
        className={[
          'lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm',
          EASE,
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer / rail */}
      <aside
        aria-label="Corporate navigation"
        aria-modal={mobileOpen ? true : undefined}
        role={mobileOpen ? 'dialog' : undefined}
        className={[
          'fixed z-50 lg:sticky lg:top-0 lg:z-20 lg:h-screen',
          'inset-y-0 left-0 w-72 max-w-[85vw] lg:max-w-none lg:w-64',
          'bg-[#1B3A6B] border-r border-white/10 flex flex-col',
          EASE,
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
          width,
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-white/10">
          <span className={['font-extrabold tracking-tight truncate', collapsed ? 'lg:hidden' : ''].join(' ')}>
            ShopTantra
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className={`lg:hidden ${TOUCH} px-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 ${EASE} ${FOCUS}`}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {renderItems((id) => {
            onSelect(id);
            setMobileOpen(false);
          })}
        </nav>

        <div className="hidden lg:flex p-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-expanded={!collapsed}
            className={`w-full ${TOUCH} flex items-center justify-center gap-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 ${EASE} ${FOCUS}`}
          >
            <ChevronLeft className={['w-4 h-4', EASE, collapsed ? 'rotate-180' : ''].join(' ')} aria-hidden="true" />
            <span className={['text-xs', collapsed ? 'lg:hidden' : ''].join(' ')}>Collapse</span>
          </button>
        </div>
      </aside>
    </>
  );
}