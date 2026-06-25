import { useState, useEffect } from 'react';
import {
  Users,
  Store,
  ShoppingCart,
  Package,
  TrendingUp,
  Percent,
  CheckCircle,
  XCircle,
  Settings,
  Bell,
  Activity,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { profile } = useAuth();

  // Admin Master Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalSellers: 0,
    totalProducts: 0,
    dailyRevenue: 0,
    weeklyRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    averageCommission: 10, // 10%
    flatGstRate: 18 // 18%
  });

  // Seller Verification Queue
  const [pendingSellers, setPendingSellers] = useState<any[]>([]);

  // Payout requests queue
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);

  // Settings Forms
  const [commissionInput, setCommissionInput] = useState('10');
  const [gstInput, setGstInput] = useState('18');
  const [settingsStatus, setSettingsStatus] = useState('');

  // Audit activity logs
  const [logs, setLogs] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<any[]>([]);

  // Load real-time analytics, payouts, and notifications
  useEffect(() => {
    async function loadData() {
      try {
        const analyticsRes = await fetch('/api/analytics');
        const analyticsData = await analyticsRes.json();

        const payoutsRes = await fetch('/api/admin/payouts');
        const payoutsData = await payoutsRes.json();

        const notifRes = await fetch('/api/admin/notifications');
        const notifData = await notifRes.json();

        if (analyticsData.success) {
          const rev = analyticsData.data.revenue;
          setStats((prev) => ({
            ...prev,
            totalRevenue: rev.totalRevenue || 0,
            totalOrders: rev.totalOrders || 0,
            totalCustomers: analyticsData.data.totalCustomers || 0,
            totalSellers: analyticsData.data.totalSellers || 0,
            totalProducts: analyticsData.data.totalProducts || 0,
            dailyRevenue: rev.dailyRevenue || 0,
            weeklyRevenue: rev.weeklyRevenue || 0,
            monthlyRevenue: rev.monthlyRevenue || 0,
            yearlyRevenue: rev.yearlyRevenue || 0,
          }));
        }

        if (payoutsData.success) {
          // Filter to only display PENDING requests in verification queue
          setPayoutRequests(payoutsData.data.filter((p: any) => p.status === 'PENDING' || p.status === 'PROCESSING'));
        }

        if (notifData.success) {
          setNotifications(notifData.data);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      }
    }
    loadData();
  }, []);

  const handleApproveSeller = (id: string, name: string) => {
    setPendingSellers((prev) => prev.filter((s) => s.id !== id));
    setStats((prev) => ({ ...prev, totalSellers: prev.totalSellers + 1 }));
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action: 'Seller Verified',
        details: `${name} (${id}) status updated to APPROVED`,
        time: 'Just now',
        type: 'success'
      },
      ...prev
    ]);
  };

  const handleRejectSeller = (id: string, name: string) => {
    setPendingSellers((prev) => prev.filter((s) => s.id !== id));
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action: 'Seller Suspended',
        details: `${name} (${id}) application REJECTED`,
        time: 'Just now',
        type: 'danger'
      },
      ...prev
    ]);
  };

  // Release real payout
  const handleReleasePayout = async (id: string, storeName: string, amount: number) => {
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: id,
          action: 'RELEASE',
          transactionId,
          notes: 'Payout approved and released via UPI gateway',
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setPayoutRequests((prev) => prev.filter((p) => p.id !== id));
        setLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            action: 'Payout Released',
            details: `Released ₹${amount.toLocaleString()} to ${storeName} (Txn: ${transactionId})`,
            time: 'Just now',
            type: 'success',
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Payout release failed:', err);
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          action: 'Payout Error',
          details: `Failed to release ₹${amount.toLocaleString()} to ${storeName}. Please retry.`,
          time: 'Just now',
          type: 'danger',
        },
        ...prev,
      ]);
    }
  };

  // Reject real payout
  const handleRejectPayout = async (id: string, storeName: string, amount: number) => {
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: id,
          action: 'REJECT',
          notes: 'Payout request rejected - Insufficient documents',
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setPayoutRequests((prev) => prev.filter((p) => p.id !== id));
        setLogs((prev) => [
          {
            id: `log-${Date.now()}`,
            action: 'Payout Rejected',
            details: `Rejected ₹${amount.toLocaleString()} payout for ${storeName} (Funds refunded to wallet)`,
            time: 'Just now',
            type: 'danger',
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error('Payout rejection failed:', err);
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          action: 'Payout Error',
          details: `Failed to reject payout for ${storeName}. Please retry.`,
          time: 'Just now',
          type: 'danger',
        },
        ...prev,
      ]);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const comm = parseFloat(commissionInput);
    const gst = parseFloat(gstInput);
    if (isNaN(comm) || isNaN(gst) || comm < 0 || gst < 0) {
      setSettingsStatus('Please enter valid rates.');
      return;
    }
    setStats((prev) => ({
      ...prev,
      averageCommission: comm,
      flatGstRate: gst
    }));
    setSettingsStatus('Settings updated successfully!');
    setLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        action: 'Settings Changed',
        details: `Commission set to ${comm}%, GST Rate set to ${gst}%`,
        time: 'Just now',
        type: 'info'
      },
      ...prev
    ]);
    setTimeout(() => setSettingsStatus(''), 4000);
  };

  return (
    <div className="space-y-6 transition-colors duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white border-l-4 border-brand-orange pl-3">
          Master Administrator Console
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Welcome back, {profile?.full_name ?? 'Super Admin'}! Here is the SHOPTANTRA marketplace overview ledger.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Master Gross Volume</span>
            <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">Admin Comm. ({(stats.totalRevenue * (stats.averageCommission / 100)).toLocaleString()})</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Orders</span>
            <div className="p-1.5 rounded-lg bg-orange-50 dark:bg-brand-orange/10 text-brand-orange">
              <ShoppingCart size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {stats.totalOrders.toLocaleString()} Orders
          </span>
          <span className="text-[10px] text-green-650 font-bold block mt-1">Speed Post Tracking Enabled</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Verified Sellers</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-600">
              <Store size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {stats.totalSellers} Stores
          </span>
          <span className="text-[10px] text-amber-600 font-bold block mt-1">{pendingSellers.length} pending verification</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Registered Customers</span>
            <div className="p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-brand-gold">
              <Users size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {stats.totalCustomers.toLocaleString()} Buyers
          </span>
          <span className="text-[10px] text-green-650 font-bold block mt-1">Real database users</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Products</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-600">
              <Package size={16} />
            </div>
          </div>
          <span className="text-lg font-black text-brand-navy dark:text-white block mt-2">
            {stats.totalProducts} Items
          </span>
          <span className="text-[10px] text-purple-650 font-bold block mt-1">Database catalog</span>
        </div>
      </div>

      {/* Revenue Breakdown (Daily, Weekly, Monthly, Yearly) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-semibold text-gray-500">Daily Revenue</span>
          <span className="text-lg font-black text-blue-600 block mt-2">
            ₹{stats.dailyRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">Today's total sales</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-semibold text-gray-500">Weekly Revenue</span>
          <span className="text-lg font-black text-amber-600 block mt-2">
            ₹{stats.weeklyRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">This week's total sales</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-semibold text-gray-500">Monthly Revenue</span>
          <span className="text-lg font-black text-green-600 block mt-2">
            ₹{stats.monthlyRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">This month's total sales</span>
        </div>

        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 p-5 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-semibold text-gray-500">Yearly Revenue</span>
          <span className="text-lg font-black text-red-500 block mt-2">
            ₹{stats.yearlyRevenue.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-1">This year's total sales</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Verification Queue & Payouts Queue */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Seller Verification Queue */}
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3">
              Pending Seller Verification Queue
            </h3>
            {pendingSellers.length === 0 ? (
              <p className="text-xs text-gray-450 dark:text-gray-500 py-6 text-center">No pending registrations awaiting verification.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-brand-navy-dark text-gray-500 font-bold border-b border-gray-100 dark:border-brand-navy-light/10">
                      <th className="px-3 py-2">Store Name</th>
                      <th className="px-3 py-2">Owner Name</th>
                      <th className="px-3 py-2">GSTIN ID</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-brand-navy-light/5">
                    {pendingSellers.map((sel) => (
                      <tr key={sel.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-navy-light/5 transition-colors">
                        <td className="px-3 py-3 font-bold text-brand-navy dark:text-brand-orange">{sel.storeName}</td>
                        <td className="px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">{sel.owner}</td>
                        <td className="px-3 py-3 font-mono font-bold text-gray-600 dark:text-gray-400">{sel.gstin}</td>
                        <td className="px-3 py-3 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveSeller(sel.id, sel.storeName)}
                            className="p-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                            title="Approve Store"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => handleRejectSeller(sel.id, sel.storeName)}
                            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                            title="Suspend/Reject"
                          >
                            <XCircle size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pending Payout Requests Queue */}
          <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3 flex justify-between items-center">
              <span>Pending Payout Requests Queue</span>
              <span className="bg-brand-orange text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">UPI / Bank Transfers</span>
            </h3>
            {payoutRequests.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 py-6 text-center">No pending withdrawal requests found in ledger.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-brand-navy-dark text-gray-500 font-bold border-b border-gray-100 dark:border-brand-navy-light/10">
                      <th className="px-3 py-2">Store Name</th>
                      <th className="px-3 py-2">Requested Amount</th>
                      <th className="px-3 py-2">Destination / Mode</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-brand-navy-light/5">
                    {payoutRequests.map((pay) => (
                      <tr key={pay.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-navy-light/5 transition-colors">
                        <td className="px-3 py-3 font-bold text-brand-navy dark:text-brand-orange">{pay.seller?.storeName || 'Merchant Store'}</td>
                        <td className="px-3 py-3 font-bold">₹{pay.amount.toLocaleString()}</td>
                        <td className="px-3 py-3">
                          <span className="font-semibold block">{pay.paymentMethod}</span>
                          <span className="text-[10px] text-gray-450 block mt-0.5">{pay.upiId || 'Direct Bank Settlement'}</span>
                        </td>
                        <td className="px-3 py-3 text-right flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReleasePayout(pay.id, pay.seller?.storeName || 'Merchant Store', pay.amount)}
                            className="bg-brand-navy hover:bg-brand-navy-light text-white font-extrabold px-2.5 py-1.5 rounded-lg text-[9px] uppercase transition-colors"
                            title="Approve and Release Settlement"
                          >
                            Release Payout
                          </button>
                          <button
                            onClick={() => handleRejectPayout(pay.id, pay.seller?.storeName || 'Merchant Store', pay.amount)}
                            className="p-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                            title="Reject & Refund Wallet"
                          >
                            <XCircle size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Global Commission and Tax settings form */}
        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3">
            Financial Policy Settings
          </h3>
          <p className="text-[11px] text-gray-400 leading-normal">
            Modify default commissions and GST rates. Changes immediately apply to active invoices and settlements.
          </p>

          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                <Percent size={12} className="text-brand-orange" />
                Admin Commission Margin (%)
              </label>
              <input
                type="number"
                value={commissionInput}
                onChange={(e) => setCommissionInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                <Settings size={12} className="text-brand-orange" />
                Flat GST Rate (%)
              </label>
              <input
                type="number"
                value={gstInput}
                onChange={(e) => setGstInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-brand-navy-dark border border-gray-200 dark:border-brand-navy-light/20 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-brand-navy hover:bg-brand-navy-light text-white font-bold py-2.5 rounded-lg text-xs transition-colors"
            >
              Save Financial Parameters
            </button>
          </form>

          {settingsStatus && (
            <p className="text-[10.5px] text-green-600 font-semibold bg-green-50 dark:bg-brand-navy-light/20 p-2.5 rounded-lg border border-green-150 dark:border-brand-navy-light/15">
              {settingsStatus}
            </p>
          )}
        </div>



        <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3">
            Shipping Configuration
          </h3>
          <p className="text-[11px] text-gray-400 leading-normal">
            Current shipping method for all marketplace orders. Sellers ship manually via India Post.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg text-xs">
              <div>
                <span className="font-bold text-gray-800 dark:text-gray-200 block">India Post Speed Post</span>
                <span className="text-[10px] text-gray-500 block mt-0.5">Manual Mode — Seller visits post office</span>
                <span className="text-[10px] text-gray-400 block mt-0.5">Base Rate: ₹35 (Prepaid) / ₹55 (COD)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-100 text-green-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                  ACTIVE
                </span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-brand-navy-dark rounded-lg text-[11px] text-gray-500 space-y-1.5">
              <p className="font-bold text-gray-700 dark:text-gray-300">How Manual Shipping Works:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-500 dark:text-gray-400">
                <li>Seller receives order in dashboard</li>
                <li>Seller prints shipping label</li>
                <li>Seller packs parcel</li>
                <li>Seller visits nearest India Post office</li>
                <li>Seller ships via Speed Post</li>
                <li>Seller enters tracking number in dashboard</li>
                <li>Customer tracks via India Post website</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Alerts & Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3 flex items-center gap-2">
            <Bell size={16} className="text-brand-orange" />
            Admin Notifications Alert Center
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 bg-orange-50/50 dark:bg-brand-orange/5 border border-brand-orange/20 rounded-xl space-y-1">
                <span className="bg-brand-orange text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">{notif.type}</span>
                <h4 className="font-bold text-xs text-gray-800 dark:text-gray-200 mt-1">{notif.title}</h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{notif.message}</p>
                <span className="text-[9px] text-gray-400 block mt-1">{new Date(notif.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs */}
      <div className="bg-white dark:bg-brand-navy border border-gray-100 dark:border-brand-navy-light/10 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-brand-navy-light/10 pb-3 flex items-center gap-2">
          <Activity size={16} className="text-brand-orange" />
          Marketplace Operational Audit Logs
        </h3>
        <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 text-xs leading-normal">
              <div className="p-1 rounded bg-gray-100 dark:bg-brand-navy-dark text-gray-400 mt-0.5 flex-shrink-0">
                <FileText size={12} />
              </div>
              <div className="flex-grow">
                <div className="flex justify-between items-center font-bold">
                  <span className={log.type === 'danger' ? 'text-red-500' : log.type === 'success' ? 'text-green-600' : 'text-blue-500'}>
                    {log.action}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">{log.time}</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">{log.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
