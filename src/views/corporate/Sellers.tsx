import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Store, RefreshCw, CheckCircle2, XCircle, Ban, PauseCircle, PackageX } from 'lucide-react';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'blocked', label: 'Blocked' },
];

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  APPROVED: 'bg-green-500/20 text-green-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  REJECTED: 'bg-red-500/20 text-red-400',
  SUSPENDED: 'bg-orange-500/20 text-orange-400',
  BLOCKED: 'bg-gray-600/30 text-gray-300',
};

// Verification is driven by the authoritative Seller.verificationStatus field
// (VERIFIED / PENDING_VERIFICATION), NOT by the redundant emailVerified boolean.
// This prevents an approved/active seller from being mislabelled "Unverified"
// simply because their email OTP flag was never switched on.
const VERIFICATION_OF = (s: any) =>
  s?.verificationStatus === 'VERIFIED'
    ? { label: 'Verified', cls: 'bg-green-500/20 text-green-400' }
    : { label: 'Unverified', cls: 'bg-yellow-500/20 text-yellow-400' };

export default function CorporateSellers() {
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
      const res = await fetch(`/api/corporate/sellers?status=${status}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTotal(json.data.total || 0);
      }
    } catch (e) {
      console.error('Sellers load error:', e);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (sellerId: string, action: string) => {
    if (action === 'reject' && !confirm('Reject this seller?')) return;
    setActing(sellerId);
    try {
      const res = await fetch('/api/corporate/seller-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sellerId, action }),
      });
      const json = await res.json();
      if (json.success) await load();
      else alert(json.error || 'Action failed');
    } catch (e) {
      alert('Failed to update seller');
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
              <h1 className="font-bold text-lg flex items-center gap-2"><Store size={20} className="text-orange-500" /> Seller Approval Center</h1>
              <p className="text-xs text-gray-400">{total} seller{total === 1 ? '' : 's'} · Filter: <span className="font-bold text-orange-400">{activeFilter}</span></p>
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
              <p className="text-gray-400 text-sm">No sellers found for <span className="font-bold text-orange-400">{activeFilter}</span>.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900/60 text-left text-[10px] uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3 text-center">Products</th>
                    <th className="px-4 py-3 text-center">Orders</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Verification</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
{items.map((s) => (
                    <tr key={s.id} className="border-t border-gray-700/60 hover:bg-gray-700/40 transition">
                      <td className="px-4 py-3">
                        <p className="font-bold">{s.storeName}</p>
                        <p className="text-[10px] text-gray-400">{s.storeDescription ? s.storeDescription.slice(0, 40) + (s.storeDescription.length > 40 ? '…' : '') : s.id.slice(0, 8) + '…'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p>{s.user?.fullName || '—'}</p>
                        <p className="text-gray-400">{s.user?.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-center font-bold">{s._count?.products ?? 0}</td>
                      <td className="px-4 py-3 text-center font-bold">{s._count?.orders ?? 0}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_STYLES[s.status] || 'bg-gray-700 text-gray-300'}`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${VERIFICATION_OF(s).cls}`}>{VERIFICATION_OF(s).label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end flex-wrap gap-1.5">
                          {s.status !== 'ACTIVE' && s.status !== 'APPROVED' && (
                            <button onClick={() => handleAction(s.id, 'approve')} disabled={acting === s.id} className="px-2.5 py-1 bg-green-600 hover:bg-green-700 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
                              <CheckCircle2 size={12} /> Approve
                            </button>
                          )}
                          {s.status !== 'REJECTED' && (
                            <button onClick={() => handleAction(s.id, 'reject')} disabled={acting === s.id} className="px-2.5 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
                              <XCircle size={12} /> Reject
                            </button>
                          )}
                          {s.status !== 'SUSPENDED' && (
                            <button onClick={() => handleAction(s.id, 'suspend')} disabled={acting === s.id} className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
                              <PauseCircle size={12} /> Suspend
                            </button>
                          )}
                          {s.status !== 'BLOCKED' && (
                            <button onClick={() => handleAction(s.id, 'block')} disabled={acting === s.id} className="px-2.5 py-1 bg-gray-600 hover:bg-gray-500 rounded-lg text-[10px] font-bold flex items-center gap-1 disabled:opacity-50">
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