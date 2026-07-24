import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, DollarSign, ShoppingCart, Package, Users, Truck, Ticket,
  TrendingUp, BarChart3, Settings, LogOut, Bell, CheckCircle2, XCircle,
  Clock, RefreshCw, ChevronDown, Menu, X, IndianRupee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface DashboardData {
  today: { revenue: number; orders: number; payments: number; newUsers: number; newSellers: number };
  company: { totalRevenue: number; monthlyRevenue: number; yearlyRevenue: number; totalOrders: number; completedOrders: number; pendingOrders: number; cancelledOrders: number; refundOrders: number };
  marketplace: { totalProducts: number; approvedProducts: number; pendingProducts: number; outOfStockProducts: number };
  sellers: { total: number; approved: number; pending: number; topSellers: any[] };
  buyers: { total: number; newToday: number };
  payments: { totalCollected: number; pendingSettlement: number };
  shipping: { ready: number; shipped: number; delivered: number };
  support: { open: number; resolved: number };
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, id: 'dashboard' },
  { label: 'Seller Approvals', icon: Users, id: 'sellers' },
  { label: 'Product Approvals', icon: Package, id: 'products' },
  { label: 'Finance', icon: DollarSign, id: 'finance' },
  { label: 'Analytics', icon: BarChart3, id: 'analytics' },
  { label: 'Support', icon: Ticket, id: 'support' },
  { label: 'Settings', icon: Settings, id: 'settings' },
];

export default function CorporateDashboard() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadDashboard() {
    try {
      setRefreshing(true);
      const res = await fetch('/api/corporate/dashboard');
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
      setLoading(false);
      setRefreshing(false);
    }
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/corporate-access');
  };

  const roleLabel = profile?.role === 'FOUNDER' ? 'Founder' : profile?.role === 'CEO_MD' ? 'CEO & MD' : 'Chairman';

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
            <span className="font-bold text-sm">Corporate Center</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded font-bold">{roleLabel}</span>
            {profile?.email && <span className="truncate">{profile.email}</span>}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${activeTab === item.id ? 'bg-orange-500/20 text-orange-400' : 'text-gray-300 hover:bg-gray-700'}`}>
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-700">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-700 transition">
            <LogOut size={18} />
            Sign Out
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
            <button onClick={loadDashboard} className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700"><RefreshCw size={16} /></button>
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

          {!error && data && (
            <>
              {/* Today's Overview */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Today's Revenue", value: `₹${(data.today.revenue).toLocaleString()}`, icon: IndianRupee, color: 'text-green-400 bg-green-500/10' },
                  { label: "Today's Orders", value: data.today.orders, icon: ShoppingCart, color: 'text-blue-400 bg-blue-500/10' },
                  { label: 'New Users', value: data.today.newUsers, icon: Users, color: 'text-purple-400 bg-purple-500/10' },
                  { label: 'New Sellers', value: data.today.newSellers, icon: Truck, color: 'text-orange-400 bg-orange-500/10' },
                  { label: 'Open Tickets', value: data.support.open, icon: Ticket, color: 'text-red-400 bg-red-500/10' },
                ].map((card, i) => (
                  <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className={`inline-flex p-2 rounded-lg ${card.color} mb-2`}><card.icon size={16} /></div>
                    <p className="text-2xl font-extrabold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Company Overview */}
              <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                <h2 className="font-bold text-base mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-orange-500" /> Company Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Revenue', value: `₹${(data.company.totalRevenue).toLocaleString()}`, sub: `Monthly: ₹${(data.company.monthlyRevenue).toLocaleString()}` },
                    { label: 'Total Orders', value: data.company.totalOrders, sub: `${data.company.completedOrders} completed` },
                    { label: 'Pending Orders', value: data.company.pendingOrders, sub: `${data.company.cancelledOrders} cancelled` },
                    { label: 'Refund Orders', value: data.company.refundOrders, sub: 'Requires attention' },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 bg-gray-900/50 rounded-lg">
                      <p className="text-xl font-extrabold">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketplace + Sellers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Package size={18} className="text-orange-500" /> Marketplace</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Total Products', value: data.marketplace.totalProducts, color: 'bg-blue-500' },
                      { label: 'Approved', value: data.marketplace.approvedProducts, color: 'bg-green-500' },
                      { label: 'Pending Approval', value: data.marketplace.pendingProducts, color: 'bg-yellow-500' },
                      { label: 'Out of Stock', value: data.marketplace.outOfStockProducts, color: 'bg-red-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.color}`} /> <span className="text-xs text-gray-300">{item.label}</span></div>
                        <span className="font-bold text-sm">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Users size={18} className="text-orange-500" /> Sellers</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Total Sellers', value: data.sellers.total, color: 'bg-blue-500' },
                      { label: 'Approved', value: data.sellers.approved, color: 'bg-green-500' },
                      { label: 'Pending Approval', value: data.sellers.pending, color: 'bg-yellow-500' },
                      { label: 'Buyers', value: data.buyers.total, color: 'bg-purple-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.color}`} /> <span className="text-xs text-gray-300">{item.label}</span></div>
                        <span className="font-bold text-sm">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shipping + Support */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Truck size={18} className="text-orange-500" /> Shipping</h2>
                  <div className="space-y-3">
                    {[
                      { label: 'Processing', value: data.shipping.ready, color: 'bg-yellow-500' },
                      { label: 'Shipped', value: data.shipping.shipped, color: 'bg-blue-500' },
                      { label: 'Delivered', value: data.shipping.delivered, color: 'bg-green-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.color}`} /> <span className="text-xs text-gray-300">{item.label}</span></div>
                        <span className="font-bold text-sm">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <h2 className="font-bold text-base mb-4 flex items-center gap-2"><Ticket size={18} className="text-orange-500" /> Support Tickets</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-xs text-gray-300">Open</span></div>
                      <span className="font-bold text-sm">{data.support.open}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> <span className="text-xs text-gray-300">Resolved</span></div>
                      <span className="font-bold text-sm">{data.support.resolved}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}