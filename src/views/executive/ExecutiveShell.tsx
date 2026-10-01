/**
 * Shared executive shell: left navigation rail, header, content, detail panel.
 *
 * Replaces the plain wrapper the three dashboards previously used. Every
 * interactive card calls `openDetail(key)`, which looks the request up in
 * `detailBuilders` and slides in the real, role-guarded data panel. A card with
 * no builder simply renders as a static panel, so nothing looks clickable that
 * is not.
 *
 * The sidebar menu is the SAME for all three roles: the underlying corporate
 * endpoints already admit FOUNDER, CEO_MD and CHAIRMAN equally, and each portal
 * is additionally gated by its own guard (FounderGuard / CEOGuard /
 * ChairmanGuard) plus `requireRole` on every endpoint. Inventing per-role menu
 * differences would misrepresent what the server actually permits.
 */
import { useCallback, useContext, useState, createContext } from 'react';
import { LayoutDashboard, Users, Building2, Package, ShoppingCart, CreditCard,
  Percent, Wallet, RefreshCw, LogOut, Shield, X } from 'lucide-react';
import ExecutiveSidebar, { type NavItem } from './ExecutiveSidebar';
import ExecutiveDetailPanel from './ExecutiveDetailPanel';
import { DETAIL_BUILDERS } from './detailBuilders';
import { EASE, FOCUS, TOUCH } from './theme';

const NAV: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'sellers', label: 'Sellers', icon: Building2 },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'commission', label: 'Commission', icon: Percent },
  { id: 'settlements', label: 'Settlements', icon: Wallet },
  { id: 'security', label: 'Security', icon: Shield },
];

/** Menu entry -> the detail view it opens. */
const NAV_TO_DETAIL: Record<string, string> = {
  users: 'users',
  sellers: 'sellers',
  products: 'products',
  orders: 'orders',
  payments: 'payments',
  commission: 'commission',
  settlements: 'settlements',
};

export default function ExecutiveShell({
  title,
  subtitle,
  role,
  loading,
  refreshing,
  onRefresh,
  onSignOut,
  children,
}: {
  title: string;
  subtitle: string;
  role: string;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const [active, setActive] = useState('overview');
  const [detailKey, setDetailKey] = useState<string | null>(null);

  // Cards call this to open the matching real-data detail panel.
  const openDetail = useCallback((key: string) => setDetailKey(key), []);
  const closeDetail = useCallback(() => setDetailKey(null), []);

  const onSelect = (id: string) => {
    setActive(id);
    const target = NAV_TO_DETAIL[id];
    if (target) setDetailKey(target);
  };

  return (
    <DetailContext.Provider value={openDetail}>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="flex">
        <ExecutiveSidebar
          items={NAV}
          activeId={active}
          onSelect={onSelect}
          roleLabel={title}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header */}
          <header className="hidden lg:flex items-center justify-between gap-4 px-6 h-16 border-b border-white/10 bg-gray-900/60 backdrop-blur sticky top-0 z-30">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold tracking-tight truncate">{title}</h1>
              <p className="text-xs text-gray-400 truncate">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-orange/15 text-brand-orange whitespace-nowrap">
                {role}
              </span>
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing || loading}
                aria-label="Refresh dashboard data"
                className={`${TOUCH} px-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50 ${EASE} ${FOCUS}`}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className={`${TOUCH} px-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 ${EASE} ${FOCUS}`}
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="sr-only">Sign out</span>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 space-y-6 min-w-0">{children}</main>
        </div>
      </div>

      <ExecutiveDetailPanel
        request={detailKey ? DETAIL_BUILDERS[detailKey]?.() ?? null : null}
        onClose={closeDetail}
      />
      </div>
    </DetailContext.Provider>
  );
}

/**
 * Lets any card inside the shell open its detail panel without prop-drilling.
 * Returns a no-op outside a shell, so a card can never crash if reused.
 */
export const DetailContext = createContext<(key: string) => void>(() => {});

export function useOpenDetail(): (key: string) => void {
  return useContext(DetailContext);
}
