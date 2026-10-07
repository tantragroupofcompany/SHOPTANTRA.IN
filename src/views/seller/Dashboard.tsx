import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ShoppingCart, AlertCircle, TrendingUp, DollarSign, Users, Award, Percent } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

function SellerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    pendingOrders: 0,
    commissionsPaid: 0,
    withdrawableBalance: 0
  });

  // Real daily sales data from the analytics API (last 7 days)
  const [weeklyData, setWeeklyData] = useState<{ label: string; value: number }[]>([]);
  // Real category data from the analytics API
  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>([]);

  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const [withdrawalInput, setWithdrawalInput] = useState('');
  const [withdrawalStatus, setWithdrawalStatus] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // sellerId must be the authenticated seller's real ID. 'seller_placeholder'
  // is intentionally kept as a last-resort fallback so the component renders
  // even before the auth profile loads; every API call that uses it already
  // validates the session server-side (requireSellerScope) so the placeholder
  // never bypasses authorisation.
  const sellerId = profile?.id || 'seller_placeholder';

  useEffect(() => {
    async function fetchStats() {
      try {
        const walletRes = await fetch(`/api/vendor/wallet?sellerId=${sellerId}`);
        const walletData = await walletRes.json();

        const analyticsRes = await fetch(`/api/analytics?sellerId=${sellerId}`);
        const analyticsData = await analyticsRes.json();

        if (walletData.success && analyticsData.success) {
          setStats({
            totalSales: analyticsData.data.revenue.totalRevenue || 0,
            totalOrders: analyticsData.data.revenue.totalOrders || 0,
            totalProducts: analyticsData.data.totalProducts || 0,
            pendingOrders: walletData.data?.metrics?.pendingOrders || 0,
            commissionsPaid: Math.round((analyticsData.data.revenue.totalRevenue * 10) / 100) || 0,
            withdrawableBalance: walletData.data?.wallet?.balance || 0,
          });

          // Build real 7-day chart data from the analytics response.
          // The API returns `data.dailyOrders` (array of { date, orders, revenue }).
          const daily: any[] = analyticsData.data.dailyOrders || [];
          if (daily.length) {
            const last7 = daily.slice(-7);
            setWeeklyData(last7.map((d: any) => ({
              label: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
              value: Number(d.revenue || 0),
            })));
          }

          // Real category breakdown from analytics
          const cats: any[] = analyticsData.data.topCategories || [];
          if (cats.length) {
            setCategoryData(cats.slice(0, 5).map((c: any) => ({
              name: c.name || c.category || 'Other',
              count: Number(c.count || c.productCount || 0),
            })));
          }
        }

        const storeRes = await fetch(`/api/seller/store-settings?userId=${sellerId}`);
        const storeData = await storeRes.json();
        if (storeData.success && storeData.data) {
          setLogoUrl(storeData.data.store_logo_url || null);
        }
      } catch (err) {
        console.error('Failed to load seller analytics:', err);
      }
    }
    fetchStats();
  }, [sellerId]);

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawalInput);
    if (isNaN(val) || val <= 0) {
      setWithdrawalStatus('Please enter a valid amount.');
      return;
    }
    if (val > stats.withdrawableBalance) {
      setWithdrawalStatus('Insufficient balance.');
      return;
    }

    try {
      setWithdrawalStatus('Processing payout request...');
      const res = await fetch('/api/vendor/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId,
          amount: val,
          paymentMethod: 'UPI',
          // UPI ID comes from the seller's verified bank/UPI details stored on
          // the server — never hardcoded in the client.
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setStats((prev) => ({
          ...prev,
          withdrawableBalance: prev.withdrawableBalance - val,
        }));
        setWithdrawalStatus(`Withdrawal request of ₹${val.toLocaleString()} submitted successfully!`);
      } else {
        setWithdrawalStatus(result.error || 'Failed to submit withdrawal request.');
      }
    } catch (err) {
      console.error('Withdrawal request failed:', err);
      setWithdrawalStatus('Failed to submit withdrawal request. Please try again.');
    }
    setWithdrawalInput('');
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center gap-4 pb-2 border-b border-gray-150 dark:border-brand-navy-light/10">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Seller Brand Logo"
            loading="lazy"
            className="w-14 h-14 rounded-xl object-cover border border-gray-200 dark:border-brand-navy-light/20 shadow-xs shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-brand-orange/10 dark:bg-brand-navy-light/20 flex items-center justify-center border border-dashed border-brand-orange/20 text-brand-orange shrink-0">
            <Award className="w-7 h-7" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
            Seller Control Console
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Welcome back, {profile?.full_name ?? 'Tantra Partner'}! Here is your marketplace statistics ledger.
          </p>
        </div>
      </div>

      {/*
        Every card below navigates to the real page that owns the data. They were
        plain <div> elements with no click handler, which is why tapping them did
        nothing. Each is now a real <Link>, so mouse, touch, Enter and Space all
        work, the destination is announced to screen readers, and the browser
        shows the correct URL. Destinations are existing seller routes
        (src/ClientApp.tsx) - no new page was invented.

        Contrast: values use text-brand-navy / dark:text-white, which stays
        readable on the white card in both themes.
      */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/seller/reports"
          aria-label="Gross revenue - open sales reports"
          className="group bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs transition-all duration-200 hover:border-brand-orange/50 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-navy min-h-[44px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Gross Revenue</span>
            <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            ₹{stats.totalSales.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">Admin fee (10%): ₹{stats.commissionsPaid}</span>
        </Link>

        <Link
          to="/seller/orders"
          aria-label="Active orders - open orders"
          className="group bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs transition-all duration-200 hover:border-brand-orange/50 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-navy min-h-[44px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Active Orders</span>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-brand-orange/10 text-brand-orange">
              <ShoppingCart size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {stats.totalOrders} Dispatches
          </span>
          <span className="text-[10px] text-amber-600 font-bold block mt-1">{stats.pendingOrders} pending labels</span>
        </Link>

        <Link
          to="/seller/products"
          aria-label="Products listed - open products"
          className="group bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs transition-all duration-200 hover:border-brand-orange/50 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-navy min-h-[44px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Products Listed</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600">
              <Package size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {stats.totalProducts} Items
          </span>
          <span className="text-[10px] text-green-650 font-bold block mt-1">All catalog active</span>
        </Link>

        <Link
          to="/seller/earnings"
          aria-label="Withdrawable balance - open earnings"
          className="group bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs transition-all duration-200 hover:border-brand-orange/50 hover:shadow-md active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-navy min-h-[44px]"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Withdrawable Net</span>
            <div className="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-brand-gold">
              <DollarSign size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            ₹{stats.withdrawableBalance.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">UPI / Bank Settlements</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Dispatches orders */}
        <div className="lg:col-span-2 bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-brand-navy-light/10 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">
              Recent Dispatches
            </h3>
            <button onClick={() => navigate('/seller/orders')} className="text-xs text-brand-orange font-bold hover:underline">
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-brand-navy-dark text-gray-500 font-bold border-b border-gray-100 dark:border-brand-navy-light/10">
                  <th className="px-3 py-2">Order ID</th>
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-brand-navy-light/5">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-navy-light/5 transition-colors">
                    <td className="px-3 py-3 font-bold text-brand-navy dark:text-brand-orange">{ord.id}</td>
                    <td className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">{ord.buyer}</td>
                    <td className="px-3 py-3 font-bold">₹{ord.amount}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${ord.status === 'Pending' ? 'bg-amber-100 text-amber-700' : ord.status === 'Processing' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Withdrawal form system */}
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3">
            UPI Settlement Portal
          </h3>
          <p className="text-[11px] text-gray-400 leading-normal">
            Withdraw your earnings directly to your verified bank account or UPI ID. Processing speed is automatic.
          </p>

          <form onSubmit={handleWithdrawal} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500">Withdrawal Amount (INR)</label>
              <input
                type="number"
                value={withdrawalInput}
                onChange={(e) => setWithdrawalInput(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-2 rounded-lg text-xs transition-colors"
            >
              Request Payout
            </button>
          </form>

          {withdrawalStatus && (
            <p className="text-[10.5px] text-brand-orange font-semibold bg-orange-50 dark:bg-brand-navy-light/20 p-2.5 rounded-lg border border-orange-100 dark:border-brand-navy-light/15">
              {withdrawalStatus}
            </p>
          )}
        </div>

      </div>

      {/* Analytics Charts — driven by real API data from /api/analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Daily Sales Revenue Chart — real 7-day data */}
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wide">Sales Analytics — Last 7 Days</h4>
          {weeklyData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-gray-400">
              No sales data yet for this period.
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-2 border-b border-l border-gray-100 dark:border-brand-navy-light/15 p-2">
              {weeklyData.map((d, idx) => {
                const maxVal = Math.max(...weeklyData.map((x) => x.value), 1);
                const heightPct = Math.max((d.value / maxVal) * 80, 2);
                const displayVal = d.value >= 1000
                  ? `₹${(d.value / 1000).toFixed(1)}K`
                  : `₹${d.value}`;
                return (
                  <div key={idx} className="flex-grow flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[9px] text-brand-orange font-bold font-mono">{displayVal}</span>
                    <div
                      className="bg-brand-orange hover:bg-brand-orange-hover rounded-t w-full transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[9px] text-gray-400 font-semibold">{d.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category breakdown — real data from analytics */}
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
          <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wide">Top Categories by Products</h4>
          {categoryData.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-xs text-gray-400">
              No category data yet.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryData.map((cat, idx) => {
                const maxCount = Math.max(...categoryData.map((c) => c.count), 1);
                const COLORS = ['bg-brand-orange', 'bg-brand-navy', 'bg-brand-gold', 'bg-blue-500', 'bg-green-500'];
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
                      <span className="text-gray-400 ml-2 shrink-0">{cat.count} products</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-brand-navy-dark h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${COLORS[idx] || 'bg-gray-400'}`}
                        style={{ width: `${Math.max((cat.count / maxCount) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default function SafeSellerDashboard() {
  return (
    <ErrorBoundary>
      <SellerDashboard />
    </ErrorBoundary>
  );
}
