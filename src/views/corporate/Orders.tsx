import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, RefreshCw, PackageX } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'refunded', label: 'Refunded' },
];

const STATUS_STYLES: Record<string, string> = {
  DELIVERED: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  PROCESSING: 'bg-blue-500/20 text-blue-400',
  PACKED: 'bg-blue-500/20 text-blue-400',
  SHIPPED: 'bg-indigo-500/20 text-indigo-400',
  OUT_FOR_DELIVERY: 'bg-indigo-500/20 text-indigo-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
  REFUNDED: 'bg-purple-500/20 text-purple-400',
  RETURNED: 'bg-orange-500/20 text-orange-400',
};

function formatCurrency(value: number): string {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function CorporateOrders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'all';

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/corporate/orders?status=${status}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTotal(json.data.total || 0);
      }
    } catch (e) {
      console.error('Orders load error:', e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const selectFilter = (key: string) => {
    setSearchParams(key === 'all' ? {} : { status: key }, { replace: false });
  };

  const activeFilter = FILTERS.find((f) => f.key === status)?.label || 'All';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/corporate/dashboard')} className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition" title="Back to dashboard">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2"><ShoppingCart size={20} className="text-orange-500" /> Order Center</h1>
              <p className="text-xs text-gray-400">{total} order{total === 1 ? '' : 's'} · Filter: <span className="font-bold text-orange-400">{activeFilter}</span></p>
            </div>
          </div>
          <button onClick={load} className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-xs font-bold flex items-center gap-2">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => selectFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${status === f.key ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-10 text-center"><RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto" /></div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <PackageX className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No orders found for <span className="font-bold text-orange-400">{activeFilter}</span>.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/60 text-left text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
{items.map((o) => (
                    <tr key={o.id} className="border-t border-gray-700/60 hover:bg-gray-700/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold text-cyan-400">{o.orderNumber || o.id.slice(0, 10)}</p>
                        <p className="text-[10px] text-gray-400">{o.paymentMethod || (o.isCod ? 'COD' : '—')}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p>{o.buyer?.fullName || '—'}</p>
                        <p className="text-gray-400">{o.buyer?.phone || o.buyer?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{o.seller?.storeName || '—'}</td>
                      <td className="px-4 py-3 text-xs">
                        {(o.items || []).map((it: any, i: number) => (
                          <p key={i}>{it.title} <span className="text-gray-400">×{it.quantity}</span></p>
                        ))}
                        {(o.items || []).length === 0 && <span className="text-gray-500">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-cyan-400 whitespace-nowrap">{formatCurrency(o.totalAmount)}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${String(o.paymentStatus || '').toUpperCase() === 'PAID' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{o.paymentStatus || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[o.status] || 'bg-gray-700 text-gray-300'}`}>{o.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}