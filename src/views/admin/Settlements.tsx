import React, { useEffect, useState } from 'react';
import { DollarSign, ShieldAlert, CheckCircle, Clock, XCircle, Settings, Save, AlertCircle } from 'lucide-react';
import Card, { StatCard } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

interface Settlement {
  id: string;
  orderId: string;
  sellerId: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  sellerPayout: number;
  status: 'PENDING' | 'PROCESSED' | 'HELD' | 'CANCELLED';
  createdAt: string;
  order?: {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
  };
  seller?: {
    storeName: string;
    user?: {
      fullName: string;
      email: string;
    };
  };
}

export default function Settlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Global Config state
  const [commissionRate, setCommissionRate] = useState(10);
  const [delayDays, setDelayDays] = useState(7);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchSettlements();
    fetchConfig();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settlements');
      const result = await res.json();
      if (res.ok && result.success) {
        setSettlements(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch settlements.');
      }
    } catch (e: any) {
      setError(e.message || 'Error occurred fetching settlements.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/commissions?type=settings');
      const result = await res.json();
      if (res.ok && result.success) {
        setCommissionRate(result.data.defaultCommissionRate || 10);
        setDelayDays(result.data.settlementDelayDays || 7);
      }
    } catch (e) {
      console.error('Error fetching global settings:', e);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      setError('');
      setSuccess('');
      const res = await fetch('/api/admin/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultCommissionRate: commissionRate,
          settlementDelayDays: delayDays,
          categoryCommissions: {}
        })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess('Marketplace settlement delay and commission configurations updated!');
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(result.error || 'Failed to update configurations.');
      }
    } catch (e: any) {
      setError(e.message || 'Error updating config.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleAction = async (commissionId: string, action: 'HOLD' | 'RELEASE' | 'CANCEL') => {
    try {
      setError('');
      setSuccess('');
      const res = await fetch('/api/admin/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId, action, notes: `Action: ${action} executed by Admin` })
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccess(`Settlement successfully updated with status: ${action === 'RELEASE' ? 'RELEASED (PROCESSED)' : action}`);
        fetchSettlements();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(result.error || 'Failed to process action on settlement.');
      }
    } catch (e: any) {
      setError(e.message || 'Error executing settlement action.');
    }
  };

  // Stats helper
  const stats = {
    pending: settlements.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + s.sellerPayout, 0),
    released: settlements.filter(s => s.status === 'PROCESSED').reduce((sum, s) => sum + s.sellerPayout, 0),
    held: settlements.filter(s => s.status === 'HELD').reduce((sum, s) => sum + s.sellerPayout, 0),
    totalCommission: settlements.reduce((sum, s) => sum + s.commissionAmount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1B3A6B]">Settlement & Payouts</h1>
          <p className="text-gray-500 mt-1">Manage vendor payouts, commissions, and marketplace settings.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-600 text-sm font-semibold p-4 rounded-xl flex items-center gap-2 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 text-sm font-semibold p-4 rounded-xl flex items-center gap-2 border border-green-100">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {success}
        </div>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-sm block">Pending Settlements</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">₹{stats.pending.toLocaleString('en-IN')}</span>
          </div>
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-sm block">Released Payouts</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">₹{stats.released.toLocaleString('en-IN')}</span>
          </div>
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-sm block">Held Settlements</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">₹{stats.held.toLocaleString('en-IN')}</span>
          </div>
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-gray-500 text-sm block">Commission Earned</span>
            <span className="text-2xl font-bold text-gray-900 mt-1 block">₹{stats.totalCommission.toLocaleString('en-IN')}</span>
          </div>
          <DollarSign className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settlements Table (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Merchant Settlements Ledger</h3>
            
            {loading ? (
              <div className="py-12 text-center text-gray-400">Loading settlements...</div>
            ) : settlements.length === 0 ? (
              <div className="py-12 text-center text-gray-400">No settlement history available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                      <th className="px-4 py-3">Order Details</th>
                      <th className="px-4 py-3">Merchant</th>
                      <th className="px-4 py-3 text-right">Payout Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settlements.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-brand-navy block">{row.order?.orderNumber || 'N/A'}</span>
                          <span className="text-[10px] text-gray-400 block">Ordered: {new Date(row.createdAt).toLocaleDateString('en-IN')}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-gray-800 block">{row.seller?.storeName || 'Merchant'}</span>
                          <span className="text-[10px] text-gray-400 block">{row.seller?.user?.fullName || ''}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                          ₹{row.sellerPayout.toLocaleString('en-IN')}
                          <span className="text-[9px] text-gray-400 block font-normal">(Rate: {row.commissionRate}%)</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <Badge
                            variant={
                              row.status === 'PROCESSED' ? 'success' :
                              row.status === 'HELD' ? 'danger' :
                              row.status === 'CANCELLED' ? 'secondary' : 'warning'
                            }
                          >
                            {row.status === 'PROCESSED' ? 'Settled' : row.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex gap-1.5 justify-center">
                            {row.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleAction(row.id, 'RELEASE')}
                                  className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded"
                                >
                                  Release
                                </button>
                                <button
                                  onClick={() => handleAction(row.id, 'HOLD')}
                                  className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-2.5 py-1 rounded"
                                >
                                  Hold
                                </button>
                              </>
                            )}
                            {row.status === 'HELD' && (
                              <button
                                onClick={() => handleAction(row.id, 'RELEASE')}
                                className="bg-green-100 hover:bg-green-200 text-green-700 text-xs font-bold px-2.5 py-1 rounded"
                              >
                                Release
                              </button>
                            )}
                            {(row.status === 'PENDING' || row.status === 'HELD') && (
                              <button
                                onClick={() => handleAction(row.id, 'CANCEL')}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded"
                              >
                                Cancel
                              </button>
                            )}
                            {(row.status === 'PROCESSED' || row.status === 'CANCELLED') && (
                              <span className="text-xs text-gray-400">Archived</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Global Configurations (Right 1 column) */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Settings className="w-5 h-5 text-brand-orange" />
              <h3 className="text-lg font-bold text-gray-900">Settlement Rules</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Platform Commission Rate (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange pr-8"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 font-bold">%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Default percentage deducted from merchant earnings.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Settlement Delay Delay (Days)
                </label>
                <select
                  value={delayDays}
                  onChange={(e) => setDelayDays(parseInt(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
                >
                  <option value="7">7 Days (Standard)</option>
                  <option value="10">10 Days</option>
                  <option value="15">15 Days (Extended)</option>
                  <option value="30">30 Days (Enterprise)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Holding days count after package is successfully delivered.</p>
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="w-full bg-brand-orange hover:bg-brand-orange-hover text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? 'Saving...' : 'Apply Settlement Rules'}
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
