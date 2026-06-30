import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, ShoppingBag, BarChart2,
  Settings, Menu, X, LogOut, Bell, DollarSign, UserCheck,
  FileText, Shield, Tag, Globe, TrendingUp, ClipboardList, Store, Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'Analytics', to: '/admin/analytics', icon: TrendingUp },
      { label: 'Revenue', to: '/admin/revenue', icon: DollarSign },
      { label: 'Reports', to: '/admin/reports', icon: BarChart2 },
    ],
  },
  {
    label: 'Users',
    items: [
      { label: 'All Users', to: '/admin/users', icon: Users },
      { label: 'Sellers', to: '/admin/sellers', icon: Store },
      { label: 'Buyers', to: '/admin/buyers', icon: UserCheck },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { label: 'Products', to: '/admin/products', icon: Package },
      { label: 'Orders', to: '/admin/orders', icon: ShoppingBag },
      { label: 'Shipments', to: '/admin/shipments', icon: Truck },
      { label: 'Pickup Locations', to: '/admin/pickup-locations', icon: Store },
      { label: 'Categories', to: '/admin/categories', icon: Tag },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Settlements', to: '/admin/settlements', icon: DollarSign },
      { label: 'Leads', to: '/admin/leads', icon: ClipboardList },
      { label: 'Subscriptions', to: '/admin/subscriptions', icon: FileText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'CMS', to: '/admin/cms', icon: Globe },
      { label: 'Banners', to: '/admin/cms?tab=banners', icon: Tag },
      { label: 'Blog Management', to: '/admin/blog-management', icon: FileText },
      { label: 'Roles & Access', to: '/admin/roles', icon: Shield },
      { label: 'Security Logs', to: '/admin/security-logs', icon: Shield },
      { label: 'Settings', to: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  // Enforce admin/executive authentication (FOUNDER, MD, CEO, ADMIN)
  const userRole = profile?.role?.toUpperCase();
  if (!user || !['ADMIN', 'FOUNDER', 'MD', 'CEO'].includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (to: string) => {
    if (to === '/admin') return location.pathname === '/admin';
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
          <div>
            <img src="/SHOPTANTRA.png" alt="ShopTantra" className="h-8 w-auto" />
            <p className="text-xs text-orange-400 mt-0.5 font-medium">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
              {profile?.full_name?.[0] ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name ?? 'Admin'}</p>
              <p className="text-xs text-orange-300 font-medium capitalize">{profile?.role?.toLowerCase() || 'Administrator'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(item => (
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
              </div>
            </div>
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
          <div className="hidden lg:flex items-center gap-2">
            <Shield className="w-4 h-4 text-orange-500" />
            <p className="text-sm font-medium text-gray-700">Admin Control Panel</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Link to="/admin/notifications" className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <Link to="/" className="text-xs text-gray-500 hover:text-orange-500">View Site</Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
