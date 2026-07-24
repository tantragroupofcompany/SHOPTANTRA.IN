import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, ShoppingCart, Package, Users, Truck, Ticket,
  TrendingUp, BarChart3, Settings, LogOut, Bell, CheckCircle2, XCircle,
  RefreshCw, Menu, IndianRupee, Shield, Activity, FileText, Globe,
  UserCheck, UserX, Clock, ThumbsUp, ThumbsDown, Eye, Download
} from 'lucide-react';

interface DashboardData {
  today: { revenue: number; orders: number; payments: number; newUsers: number; newSellers: number; newBuyers: number };
  company: { totalRevenue: number; monthlyRevenue: number; yearlyRevenue: number; totalOrders: number; completedOrders: number; pendingOrders: number; cancelledOrders: number; refundOrders: number };
  marketplace: { totalProducts: number; approvedProducts: number; pendingProducts: number; outOfStockProducts: number; draftProducts: number };
  sellers: { total: number; approved: number; pending: number; rejected: number; suspended: number; newToday: number; newThisWeek: number; newThisMonth: number; pendingApprovalSellers: any[] };
  buyers: { total: number; newToday: number; active: number; inactive: number; topBuyers: any[] };
  payments: { totalCollected: number; pendingSettlement: number; razorpay: number; cashfree: number; phonepe: number; cod: number; commissionCollected: number };
  shipping: { ready: number; packed: number; shipped: number; inTransit: number; delivered: number; returned: number; cancelled: number };
  support: { open: number; resolved: number; pending: number };
  products: { pendingProducts: any[] };
  revenueByMonth: { month: string; revenue: number }[];
  ordersByMonth: { month: string; count: number }[];
  topProducts: any[];
  topCategories: any[];
  visitors: { today: number; weekly: number; monthly: number };
}

interface CorporateUser {
  id: string;
  email: string;
  username: string;
  role: string;
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { label: 'Seller Approval', icon: UserCheck, id: 'sellers' },
  { label: 'Product Approval', icon: Package, id: 'products' },
  { label: 'Finance', icon: DollarSign, id: 'finance' },
  { label: 'Analytics', icon: BarChart3, id: 'analytics' },
  { label: 'Support', icon: Ticket, id: 'support' },
  { label: 'Security', icon: Shield, id: 'security' },
  { label: 'Settings', icon: Settings, id: 'settings' },
];

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const [corpUser, setCorpUser] = useState<CorporateUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    verifyAndLoad();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  async function verifyAndLoad() {
    try {
      // Verify JWT cookie
      const verifyRes = await fetch('/api/corporate/verify', { credentials: 'include' });
      if (!verifyRes.ok) {
        navigate('/corporate-access', { replace: true });
        return;
      }
      const verifyData = await verifyRes.json();
      if (verifyData.authenticated) {
        setCorpUser(verifyData.user);
      } else {
        navigate('/corporate-access', { replace: true });
        return;
      }
      await loadDashboard();
    } catch (e) {
      navigate('/corporate-access', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/corporate/dashboard', { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
        setError(null);
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setRefreshing(false);
    }
  }

  const handleLogout = async () => {
    // Clear cookies by setting maxAge to 0
    document.cookie = 'auth_token=; path=/; max-age=0';
    document.cookie = 'corporate_auth_token=; path=/; max-age=0';
    navigate('/corporate-access', { replace: true });
  };

  const handleSellerAction = async (sellerId: string, action: string) => {
    try {
      const res = await fetch('/api/corporate/seller-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sellerId, action }),
      });
      const json = await res.json();
      if (json.success) {
        await loadDashboard();
      } else {
        alert(json.error || 'Action failed');
      }
    } catch (e) {
      alert('Failed to perform action');
    }
  };

  const handleProductAction = async (productId: string, action: string) => {
    try {
      const res = await fetch('/api/corporate/product-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, action }),
      });
      const json = await res.json();
      if (json.success) {
        await loadDashboard();
      } else {
        alert(json.error || 'Action failed');
      }
    } catch (e) {
      alert('Failed to perform action');
    }
  };

  const roleLabel = corpUser?.role === 'FOUNDER' ? 'Founder' : corpUser?.role === 'CEO_MD' ? 'CEO & MD' : 'Chairman';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-800 z-40 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/SHOPTANTRA.png" alt="ShopTantra" className="h-8 object-contain brightness-0 invert" />
            <span className="font-bold text-sm">Corporate ERP</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded font-bold">{roleLabel}</span>
            {corpUser?.email && <span className="truncate">{corpUser.email}</span>}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${activeTab === item.id ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300 hover:bg-gray-700'}`}>
              <item.icon size={18} />
              {item.label}
              {item.id === 'sellers' && data?.sellers.pending ? (
                <span className="ml-auto bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{data.sellers.pending}</span>
              ) : null}
              {item.id === 'products' && data?.marketplace.pendingProducts ? (
                <span className="ml-auto bg-yellow-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{data.marketplace.pendingProducts}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-300"><Menu size={20} /></button>
            <h1 className="font-bold text-lg">Corporate Control Center</h1>
          </div>
          <div className="flex items-center gap-3">
            {refreshing && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
            <button onClick={loadDashboard} className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-70"><RefreshCw size={16} /></button>
            <div className="relative">
              <Bell size={18} className="text-gray-400" />
              {data?.support.open ? <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold">{data.support.open}</span> : null}
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 flex items-center gap-2">
              <XCircle size={16} /> {error}
            </div>
          )}

          {!error && data && activeTab === 'dashboard' && (
            <>
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
                {[
                  { label: 'Today Revenue', value: `₹${(data.today.revenue).toLocaleString()}`, icon: IndianRupee, color: 'text-green-400 bg-green-500/10' },
                  { label: 'Monthly Revenue', value: `₹${(data.company.monthlyRevenue).toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400 bg-blue-500/10' },
                  { label: 'Total Orders', value: data.company.totalOrders, icon: ShoppingCart, color: 'text-purple-400 bg-purple-500/10' },
                  { label: 'Pending Orders', value: data.company.pendingOrders, icon: Clock, color: 'text-yellow-400 bg-yellow-500/10' },
                  { label: 'Total Sellers', value: data.sellers.total, icon: Users, color: 'text-orange-400 bg-orange-500/10' },
                  { label: 'Pending Sellers', value: data.sellers.pending, icon: UserCheck, color: 'text-red-400 bg-red-500/10' },
                  { label: 'Total Products', value: data.marketplace.totalProducts, icon: Package, color: 'text-cyan-400 bg-cyan-500/10' },
                  { label: 'Open Tickets', value: data.support.open, icon: Ticket, color: 'text-pink-400 bg-pink-500/10' },
                ].map((card, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                    <div className={`inline-flex p-1.5 rounded-lg ${card.color} mb-1.5`}><card.icon size={14} /></div>
                    <p className="text-lg font-extrabold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                    <p className="text-[10px] text-gray-400">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Company Overview Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 lg:col-span-2">
                  <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-orange-500" /> Revenue Summary</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Revenue', value: `₹${(data.company.totalRevenue).toLocaleString()}` },
                      { label: 'Monthly', value: `₹${(data.company.monthlyRevenue).toLocaleString()}` },
                      { label: 'Yearly', value: `₹${(data.company.yearlyRevenue).toLocaleString()}` },
                      { label: 'Payments Today', value: data.today.payments },
                    ].map((s, i) => (
                      <div key={i} className="p-2.5 bg-gray-900/50 rounded-lg">
                        <p className="text-base font-extrabold">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                        <p className="text-[10px] text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><ShoppingCart size={16} className="text-orange-500" /> Orders</h2>
                  <div className="space-y-2">
                    {[
                      { label: 'Completed', value: data.company.completedOrders, pct: data.company.totalOrders ? Math.round(data.company.completedOrders / data.company.totalOrders * 100) : 0 },
                      { label: 'Pending', value: data.company.pendingOrders, pct: data.company.totalOrders ? Math.round(data.company.pendingOrders / data.company.totalOrders * 100) : 0 },
                      { label: 'Cancelled', value: data.company.cancelledOrders, pct: data.company.totalOrders ? Math.round(data.company.cancelledOrders / data.company.totalOrders * 100) : 0 },
                      { label: 'Refunded', value: data.company.refundOrders, pct: data.company.totalOrders ? Math.round(data.company.refundOrders / data.company.totalOrders * 100) : 0 },
                    ].map((o, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">{o.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{o.value}</span>
                          <span className="text-gray-500">({o.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Marketplace + Sellers + Buyers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-xs mb-3 uppercase tracking-wider text-gray-400"><Package size={14} className="inline mr-1 text-orange-500" /> Products</h2>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Total', value: data.marketplace.totalProducts },
                      { label: 'Approved', value: data.marketplace.approvedProducts },
                      { label: 'Pending', value: data.marketplace.pendingProducts },
                      { label: 'Draft', value: data.marketplace.draftProducts },
                      { label: 'Out of Stock', value: data.marketplace.outOfStockProducts },
                    ].map((p, i) => (
                      <div key={i} className="flex justify-between"><span className="text-gray-400">{p.label}</span><span className="font-bold">{p.value}</span></div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-xs mb-3 uppercase tracking-wider text-gray-400"><Users size={14} className="inline mr-1 text-orange-500" /> Sellers</h2>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Total', value: data.sellers.total },
                      { label: 'Approved', value: data.sellers.approved },
                      { label: 'Pending', value: data.sellers.pending },
                      { label: 'Rejected', value: data.sellers.rejected },
                      { label: 'Suspended', value: data.sellers.suspended },
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between"><span className="text-gray-400">{s.label}</span><span className="font-bold">{s.value}</span></div>
                    ))}
                    {data.sellers.newToday > 0 && <div className="mt-2 pt-2 border-t border-gray-700 text-green-400">+{data.sellers.newToday} registered today</div>}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-xs mb-3 uppercase tracking-wider text-gray-400"><UserCheck size={14} className="inline mr-1 text-orange-500" /> Buyers</h2>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: 'Total', value: data.buyers.total },
                      { label: 'New Today', value: data.buyers.newToday },
                      { label: 'Active', value: data.buyers.active },
                      { label: 'Inactive', value: data.buyers.inactive },
                    ].map((b, i) => (
                      <div key={i} className="flex justify-between"><span className="text-gray-400">{b.label}</span><span className="font-bold">{b.value}</span></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipping + Payments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-xs mb-3 uppercase tracking-wider text-gray-400"><Truck size={14} className="inline mr-1 text-orange-500" /> Shipping</h2>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { label: 'Ready', value: data.shipping.ready, color: 'text-yellow-400' },
                      { label: 'Shipped', value: data.shipping.shipped, color: 'text-blue-400' },
                      { label: 'Delivered', value: data.shipping.delivered, color: 'text-green-400' },
                      { label: 'In Transit', value: data.shipping.inTransit, color: 'text-cyan-400' },
                      { label: 'Returned', value: data.shipping.returned, color: 'text-red-400' },
                      { label: 'Cancelled', value: data.shipping.cancelled, color: 'text-gray-400' },
                    ].map((sh, i) => (
                      <div key={i} className="p-2 bg-gray-900/50 rounded-lg text-center">
                        <p className={`font-bold text-sm ${sh.color}`}>{sh.value}</p>
                        <p className="text-[10px] text-gray-400">{sh.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-xs mb-3 uppercase tracking-wider text-gray-400"><DollarSign size={14} className="inline mr-1 text-orange-500" /> Payments</h2>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-400">Total Collected</span><span className="font-bold">₹{(data.payments.totalCollected).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Pending Settlement</span><span className="font-bold">₹{(data.payments.pendingSettlement).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Commission</span><span className="font-bold">₹{(data.payments.commissionCollected).toLocaleString()}</span></div>
                    <div className="mt-2 pt-2 border-t border-gray-700 grid grid-cols-2 gap-2">
                      <div><span className="text-gray-400">Razorpay</span><p className="font-bold">₹{(data.payments.razorpay).toLocaleString()}</p></div>
                      <div><span className="text-gray-400">Cashfree</span><p className="font-bold">₹{(data.payments.cashfree).toLocaleString()}</p></div>
                      <div><span className="text-gray-400">PhonePe</span><p className="font-bold">₹{(data.payments.phonepe).toLocaleString()}</p></div>
                      <div><span className="text-gray-400">COD</span><p className="font-bold">₹{(data.payments.cod).toLocaleString()}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Support + Visitors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-xs mb-3 uppercase tracking-wider text-gray-400"><Ticket size={14} className="inline mr-1 text-orange-500" /> Support</h2>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-gray-900/50 rounded-lg text-center"><p className="font-bold text-red-400">{data.support.open}</p><p className="text-gray-400">Open</p></div>
                    <div className="p-2 bg-gray-900/50 rounded-lg text-center"><p className="font-bold text-green-400">{data.support.resolved}</p><p className="text-gray-400">Resolved</p></div>
                    <div className="p-2 bg-gray-900/50 rounded-lg text-center"><p className="font-bold text-yellow-400">{data.support.pending}</p><p className="text-gray-400">Pending</p></div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <h2 className="font-bold text-xs mb-3 uppercase tracking-wider text-gray-400"><Activity size={14} className="inline mr-1 text-orange-500" /> Visitors</h2>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-gray-900/50 rounded-lg text-center"><p className="font-bold">{data.visitors.today}</p><p className="text-gray-400">Today</p></div>
                    <div className="p-2 bg-gray-900/50 rounded-lg text-center"><p className="font-bold">{data.visitors.weekly}</p><p className="text-gray-400">Weekly</p></div>
                    <div className="p-2 bg-gray-900/50 rounded-lg text-center"><p className="font-bold">{data.visitors.monthly}</p><p className="text-gray-400">Monthly</p></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Seller Approval Center */}
          {!error && data && activeTab === 'sellers' && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2"><UserCheck size={18} className="text-orange-500" /> Seller Approval Center</h2>
              {data.sellers.pendingApprovalSellers && data.sellers.pendingApprovalSellers.length > 0 ? (
                <div className="space-y-3">
                  {data.sellers.pendingApprovalSellers.map((seller: any) => (
                    <div key={seller.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-gray-400 block">Business</span><span className="font-bold">{seller.storeName}</span></div>
                        <div><span className="text-gray-400 block">Owner</span><span className="font-bold">{seller.ownerName || '—'}</span></div>
                        <div><span className="text-gray-400 block">Email</span><span>{seller.email}</span></div>
                        <div><span className="text-gray-400 block">Mobile</span><span>{seller.phone || '—'}</span></div>
                        <div><span className="text-gray-400 block">GST</span><span>{seller.gstNumber || '—'}</span></div>
                        <div><span className="text-gray-400 block">PAN</span><span>{seller.panNumber || '—'}</span></div>
                        <div><span className="text-gray-400 block">Registered</span><span>{seller.createdAt ? new Date(seller.createdAt).toLocaleDateString('en-IN') : '—'}</span></div>
                        <div><span className="text-gray-400 block">Status</span><span className="text-yellow-400 font-bold">{seller.status}</span></div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => handleSellerAction(seller.id, 'approve')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold flex items-center gap-1"><ThumbsUp size={12} /> Approve</button>
                        <button onClick={() => { if (confirm('Reject this seller?')) handleSellerAction(seller.id, 'reject'); }} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold flex items-center gap-1"><ThumbsDown size={12} /> Reject</button>
                        <button onClick={() => handleSellerAction(seller.id, 'suspend')} className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-xs font-bold">Suspend</button>
                        <button onClick={() => handleSellerAction(seller.id, 'restore')} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-bold">Restore</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">No pending seller approvals.</p>
              )}
            </div>
          )}

          {/* Product Approval Center */}
          {!error && data && activeTab === 'products' && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Package size={18} className="text-orange-500" /> Product Approval Center</h2>
              {data.products.pendingProducts && data.products.pendingProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.products.pendingProducts.map((product: any) => (
                    <div key={product.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                        <div className="md:col-span-2"><span className="text-gray-400 block">Product</span><span className="font-bold">{product.title}</span></div>
                        <div><span className="text-gray-400 block">Price</span><span className="font-bold">₹{product.price}</span></div>
                        <div><span className="text-gray-400 block">Stock</span><span>{product.stock}</span></div>
                        <div><span className="text-gray-400 block">Status</span><span className="text-yellow-400 font-bold">{product.status}</span></div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => handleProductAction(product.id, 'approve')} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-bold">Approve</button>
                        <button onClick={() => { if (confirm('Reject this product?')) handleProductAction(product.id, 'reject'); }} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold">Reject</button>
                        <button onClick={() => handleProductAction(product.id, 'block')} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 rounded-lg text-xs font-bold">Block</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs">No pending product approvals.</p>
              )}
            </div>
          )}

          {/* Finance Tab */}
          {!error && data && activeTab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><DollarSign size={16} className="text-orange-500" /> Revenue Breakdown</h2>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Total Revenue</span><span className="font-bold text-green-400">₹{(data.company.totalRevenue).toLocaleString()}</span></div>
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Monthly Revenue</span><span className="font-bold">₹{(data.company.monthlyRevenue).toLocaleString()}</span></div>
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Commission Collected</span><span className="font-bold">₹{(data.payments.commissionCollected).toLocaleString()}</span></div>
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Pending Settlement</span><span className="font-bold text-yellow-400">₹{(data.payments.pendingSettlement).toLocaleString()}</span></div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Globe size={16} className="text-orange-500" /> Gateway Wise</h2>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Razorpay</span><span className="font-bold">₹{(data.payments.razorpay).toLocaleString()}</span></div>
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Cashfree</span><span className="font-bold">₹{(data.payments.cashfree).toLocaleString()}</span></div>
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">PhonePe</span><span className="font-bold">₹{(data.payments.phonepe).toLocaleString()}</span></div>
                  <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">COD</span><span className="font-bold">₹{(data.payments.cod).toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Support Tab */}
          {!error && data && activeTab === 'support' && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Ticket size={16} className="text-orange-500" /> Support Tickets</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-4 bg-gray-900/50 rounded-lg"><p className="text-2xl font-bold text-red-400">{data.support.open}</p><p className="text-xs text-gray-400">Open</p></div>
                <div className="p-4 bg-gray-900/50 rounded-lg"><p className="text-2xl font-bold text-green-400">{data.support.resolved}</p><p className="text-xs text-gray-400">Resolved</p></div>
                <div className="p-4 bg-gray-900/50 rounded-lg"><p className="text-2xl font-bold text-yellow-400">{data.support.pending}</p><p className="text-xs text-gray-400">Pending</p></div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {!error && data && activeTab === 'analytics' && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-orange-500" /> Top Selling Products</h2>
              {data.topProducts && data.topProducts.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {data.topProducts.map((p: any, i: number) => (
                    <div key={i} className="flex justify-between p-2 bg-gray-900/50 rounded"><span>{p.title}</span><span className="font-bold">₹{(p.revenue || 0).toLocaleString()}</span></div>
                  ))}
                </div>
              ) : <p className="text-gray-400 text-xs">No data yet.</p>}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Shield size={16} className="text-orange-500" /> Security Center</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Current Session Role</span><span className="font-bold text-orange-400">{roleLabel}</span></div>
                <div className="flex justify-between p-2 bg-gray-900/50 rounded"><span className="text-gray-400">Logged in as</span><span className="font-bold">{corpUser?.email || '—'}</span></div>
                <button onClick={handleLogout} className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-bold">Sign Out All Sessions</button>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><Settings size={16} className="text-orange-500" /> System Settings</h2>
              <p className="text-xs text-gray-400">System settings management coming soon. All core ERP dashboard modules are active.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}