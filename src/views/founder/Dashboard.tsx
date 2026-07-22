'use client';

import { useNavigate } from 'react-router-dom';
import { Building2, Users, Package, ShoppingCart, Shield } from 'lucide-react';

export default function FounderDashboard() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Founder Dashboard</h1>
            <p className="text-gray-300 text-sm mt-1">Full website control and executive oversight.</p>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-200 hover:text-white">Back to site</button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-brand-orange" />
              <div>
                <p className="text-xs text-gray-300">Users</p>
                <p className="text-xl font-bold">—</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-brand-orange" />
              <div>
                <p className="text-xs text-gray-300">Products</p>
                <p className="text-xl font-bold">—</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-6 h-6 text-brand-orange" />
              <div>
                <p className="text-xs text-gray-300">Orders</p>
                <p className="text-xl font-bold">—</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-6 border border-white/10">
          <h2 className="font-bold text-lg mb-3">Executive Overview</h2>
          <p className="text-sm text-gray-300">Founder controls placeholder. Connect backend APIs to populate live metrics.</p>
        </div>
      </div>
    </div>
  );
}