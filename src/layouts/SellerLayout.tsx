import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Package, ShoppingBag, BarChart2, Star,
  DollarSign, Settings, Users, Menu, X, ChevronDown, LogOut,
  Bell, TrendingUp, ClipboardList, User, Tag, Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/seller', icon: LayoutDashboard },
  { label: 'Store Settings', to: '/seller/store', icon: Store },
  { label: 'Products', to: '/seller/products', icon: Package },
  { label: 'Add Product', to: '/seller/products/new', icon: ClipboardList },
  { label: 'Inventory', to: '/seller/inventory', icon: ClipboardList },
  { label: 'Orders', to: '/seller/orders', icon: ShoppingBag },
  { label: 'Shipments', to: '/seller/shipments', icon: Truck },
  { label: 'Coupons', to: '/seller/coupons', icon: Tag },
  { label: 'Earnings', to: '/seller/earnings', icon: DollarSign },
  { label: 'Sales Reports', to: '/seller/reports', icon: BarChart2 },
  { label: 'Analytics', to: '/seller/analytics', icon: TrendingUp },
  { label: 'Reviews', to: '/seller/reviews', icon: Star },
  { label: 'Profile', to: '/seller/profile', icon: User },
  { label: 'Settings', to: '/seller/settings', icon: Settings },
];

export function SellerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'seller') {
    return <Navigate to="/login" replace />;
  }

  const isActive = (to: string) => {
    if (to === '/seller') return location.pathname === '/seller';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#1B3A6B] text-white z-40
        transform transition-transform duration-300 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <img src="/SHOPTANTRA.png" alt="ShopTantra" className="h-8 w-auto" />
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
              {profile?.full_name?.[0] ?? 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Seller'}</p>
              <p className="text-xs text-gray-300">Seller Account</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive(item.to)
                  ? 'bg-orange-500 text-white font-medium'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'}
              `}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm text-gray-500">Seller Dashboard</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/seller/notifications" className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            </Link>
            <Link to="/" className="text-xs text-gray-500 hover:text-orange-500">View Store</Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
