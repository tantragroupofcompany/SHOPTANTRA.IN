import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, CheckCircle2, XCircle, Ban, RotateCcw, PackageX } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'draft', label: 'Draft' },
  { key: 'outofstock', label: 'Out of Stock' },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  active: 'bg-green-500/20 text-green-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  rejected: 'bg-red-500/20 text-red-400',
  BLOCKED: 'bg-gray-600/30 text-gray-300',
  DRAFT: 'bg-blue-500/20 text-blue-400',
  draft: 'bg-blue-500/20 text-blue-400',
};

function formatCurrency(value: number): string {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function CorporateProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || 'all';

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/corporate/products?status=${status}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTotal(json.data.total || 0);
      }
    } catch (e) {
      console.error('Products load error:', e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (productId: string, action: string) => {
    if (action === 'reject' && !confirm('Reject this product?')) return;
    setActing(productId);
    try {
      const res = await fetch('/api/corporate/product-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, action }),
      });
      const json = await res.json();
      if (json.success) await load();
      else alert(json.error || 'Action failed');
    } catch (e) {
      alert('Failed to update product');
    } finally {
      setActing(null);
    }
  };

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
              <h1 className="font-bold text-lg flex items-center gap-2"><Package size={20} className="text-orange-500" /> Product Approval Center</h1>
              <p className="text-xs text-gray-400">{total} product{total === 1 ? '' : 's'} · Filter: <span className="font-bold text-orange-400">{activeFilter}</span></p>
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
              <p className="text-gray-400 text-sm">No products found for <span className="font-bold text-orange-400">{activeFilter}</span>.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/60 text-left text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-center">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Added</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
{items.map((p) => (
                    <tr key={p.id} className="border-t border-gray-700/60 hover:bg-gray-700/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold">{p.title}</p>
                        <p className="text-[10px] text-gray-400">{p.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{p.seller?.storeName || '—'}</td>
                      <td className="px-4 py-3 text-xs">{p.category || 'General'}</td>
                      <td className="px-4 py-3 text-right font-bold text-cyan-400 whitespace-nowrap">{formatCurrency(p.price)}</td>
                      <td className={`px-4 py-3 text-center font-bold ${p.stock === 0 ? 'text-red-400' : 'text-gray-200'}`}>{p.stock}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[p.status] || 'bg-gray-700 text-gray-300'}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end flex-wrap gap-1.5">
                          {p.status.toLowerCase() !== 'active' && p.status.toLowerCase() !== 'approved' && (
                            <button onClick={() => handleAction(p.id, 'approve')} disabled={acting === p.id} className="px-2.5 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
                              <CheckCircle2 size={12} /> Approve
                            </button>
                          )}
                          {p.status.toLowerCase() === 'active' && (
                            <button onClick={() => handleAction(p.id, 'unpublish')} disabled={acting === p.id} className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
                              <RotateCcw size={12} /> Unpublish
                            </button>
                          )}
                          {p.status.toLowerCase() !== 'rejected' && (
                            <button onClick={() => handleAction(p.id, 'reject')} disabled={acting === p.id} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                          {p.status.toLowerCase() !== 'blocked' && (
                            <button onClick={() => handleAction(p.id, 'block')} disabled={acting === p.id} className="px-2.5 py-1 bg-gray-600 hover:bg-gray-500 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
                              <Ban size={12} /> Block
                            </button>
                          )}
                        </div>
                      </td>
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