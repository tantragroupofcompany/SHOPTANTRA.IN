import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Users, RefreshCw, UserX } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

export default function CorporateCustomers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'all';

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/corporate/customers?status=${status}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTotal(json.data.total || 0);
      }
    } catch (e) {
      console.error('Customers load error:', e);
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
              <h1 className="font-bold text-lg flex items-center gap-2"><Users size={20} className="text-orange-500" /> Customer Management</h1>
              <p className="text-xs text-gray-400">{total} customer{total === 1 ? '' : 's'} · Filter: <span className="font-bold text-orange-400">{activeFilter}</span></p>
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
              <UserX className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No customers found for <span className="font-bold text-orange-400">{activeFilter}</span>.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/60 text-left text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
{items.map((c) => (
                    <tr key={c.id} className="border-t border-gray-700/60 hover:bg-gray-700/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{c.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{c.email || '—'}</td>
                      <td className="px-4 py-3 text-xs">{c.phone || '—'}</td>
                      <td className="px-4 py-3 text-center font-bold">{c.orderCount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/30 text-gray-300'}`}>
                          {c.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}</td>
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