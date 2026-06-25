import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Plus, Edit2, Trash2, Tag, Percent, Calendar, Eye, EyeOff, BarChart2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface SellerCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minSpend: number;
  expiryDate: string;
  status: 'active' | 'inactive';
  usageCount: number;
  totalSavings: number;
}

export default function SafeSellerCoupons() {
  return (
    <ErrorBoundary>
      <SellerCoupons />
    </ErrorBoundary>
  );
}

function SellerCoupons() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<SellerCoupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState(10);
  const [formMinSpend, setFormMinSpend] = useState(499);
  const [formExpiryDate, setFormExpiryDate] = useState('2026-12-31');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoupons = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/seller/coupons?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCoupons(data.data);
        } else {
          setError(data.error || 'Failed to fetch coupons');
        }
      } else {
        setError('Failed to fetch coupons');
      }
    } catch (err: any) {
      console.error('Error fetching coupons:', err);
      setError(err.message || 'Error fetching coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [user]);

  const handleOpenAddModal = () => {
    setFormCode('');
    setFormDiscountType('percentage');
    setFormDiscountValue(10);
    setFormMinSpend(499);
    setFormExpiryDate('2026-12-31');
    setFormStatus('active');
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (coupon: SellerCoupon) => {
    setFormCode(coupon.code);
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue);
    setFormMinSpend(coupon.minSpend);
    setFormExpiryDate(coupon.expiryDate);
    setFormStatus(coupon.status);
    setEditingId(coupon.id);
    setIsModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !user?.id) return;

    try {
      let res;
      if (editingId) {
        res = await fetch('/api/seller/coupons', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            code: formCode,
            discountType: formDiscountType,
            discountValue: formDiscountValue,
            minSpend: formMinSpend,
            expiryDate: formExpiryDate,
            status: formStatus
          })
        });
      } else {
        res = await fetch('/api/seller/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            code: formCode,
            discountType: formDiscountType,
            discountValue: formDiscountValue,
            minSpend: formMinSpend,
            expiryDate: formExpiryDate,
            status: formStatus
          })
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsModalOpen(false);
          fetchCoupons();
        } else {
          alert(data.error || 'Failed to save coupon');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save coupon');
      }
    } catch (err: any) {
      console.error('Failed to save coupon:', err);
      alert(err.message || 'Error occurred while saving coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon code?')) {
      try {
        const res = await fetch(`/api/seller/coupons?id=${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchCoupons();
        } else {
          alert('Failed to delete coupon');
        }
      } catch (err: any) {
        console.error('Failed to delete coupon:', err);
        alert(err.message || 'Error deleting coupon');
      }
    }
  };

  const toggleCouponStatus = async (id: string) => {
    const coupon = coupons.find(c => c.id === id);
    if (!coupon) return;
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/seller/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: newStatus
        })
      });
      if (res.ok) {
        fetchCoupons();
      }
    } catch (err) {
      console.error('Failed to toggle coupon status:', err);
    }
  };

  // Analytics totals
  const totalCoupons = coupons.length;
  const totalUsages = coupons.reduce((sum, c) => sum + c.usageCount, 0);
  const totalSavings = coupons.reduce((sum, c) => sum + c.totalSavings, 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Store Coupons Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create, update, and track discount promo codes for your vendor items.
          </p>
        </div>
        <Button onClick={handleOpenAddModal} variant="primary" size="md" icon={<Plus size={16} />}>
          Create Coupon
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center justify-between bg-gradient-to-br from-brand-navy to-brand-navy-light text-white border-0">
          <div>
            <span className="text-xs text-gray-300 font-bold uppercase tracking-wider block">Total Active Promo Codes</span>
            <span className="text-3xl font-black block mt-2">{totalCoupons}</span>
          </div>
          <Tag size={40} className="text-brand-orange opacity-60" />
        </Card>
        <Card className="p-6 flex items-center justify-between bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10">
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Coupon Redemptions</span>
            <span className="text-3xl font-black block mt-2 text-brand-navy dark:text-white">{totalUsages}</span>
          </div>
          <BarChart2 size={40} className="text-brand-orange" />
        </Card>
        <Card className="p-6 flex items-center justify-between bg-white dark:bg-brand-navy border border-gray-150/40 dark:border-brand-navy-light/10">
          <div>
            <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider block">Customer Savings Provided</span>
            <span className="text-3xl font-black block mt-2 text-brand-navy dark:text-white">₹{totalSavings}</span>
          </div>
          <Percent size={40} className="text-brand-orange" />
        </Card>
      </div>

      {/* Coupons Table */}
      <Card className="overflow-hidden border border-gray-150/40 dark:border-brand-navy-light/10">
        <div className="p-4 bg-gray-50 dark:bg-brand-navy-dark border-b border-gray-150/40 dark:border-brand-navy-light/10">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">Active Store Promotions</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-brand-navy border-b border-gray-150/40 dark:border-brand-navy-light/10 text-gray-500 dark:text-gray-400 font-bold">
                <th className="p-4">Promo Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Min. Spend</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Usage Counts</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-brand-navy-light/10">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 dark:text-gray-500">
                    No promo codes active yet. Click "Create Coupon" to begin.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 dark:hover:bg-brand-navy-light/5 transition-colors">
                    <td className="p-4 font-extrabold text-gray-800 dark:text-gray-100">{coupon.code}</td>
                    <td className="p-4">
                      <span className="bg-brand-orange/10 text-brand-orange font-bold px-2 py-0.5 rounded">
                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`} Off
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">₹{coupon.minSpend}</td>
                    <td className="p-4 font-semibold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mt-1">
                      <Calendar size={14} className="text-gray-400" />
                      {coupon.expiryDate}
                    </td>
                    <td className="p-4 font-bold text-gray-800 dark:text-gray-300">
                      {coupon.usageCount} times <span className="text-xs text-gray-400 font-medium block">Saved ₹{coupon.totalSavings}</span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleCouponStatus(coupon.id)}
                        className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded ${coupon.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-150 text-gray-500'}`}
                      >
                        {coupon.status === 'active' ? <Eye size={12} /> : <EyeOff size={12} />}
                        {coupon.status}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button onClick={() => handleOpenEditModal(coupon)} variant="outline" size="sm" icon={<Edit2 size={12} />} />
                        <Button onClick={() => handleDeleteCoupon(coupon.id)} variant="danger" size="sm" icon={<Trash2 size={12} />} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-brand-navy rounded-3xl border border-gray-100 dark:border-brand-navy-light/10 shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
            <div className="p-5 bg-gray-50 dark:bg-brand-navy-dark border-b border-gray-100 dark:border-brand-navy-light/10 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 dark:text-white">
                {editingId ? 'Edit Coupon Code' : 'Create New Coupon'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSaveCoupon} className="p-5 space-y-4">
              <Input
                label="Coupon Code"
                placeholder="e.g. WELCOME25"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Discount Type"
                  value={formDiscountType}
                  onChange={(e) => setFormDiscountType(e.target.value as 'percentage' | 'flat')}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Cash (₹)</option>
                </Select>

                <Input
                  label="Value"
                  type="number"
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Spend (₹)"
                  type="number"
                  value={formMinSpend}
                  onChange={(e) => setFormMinSpend(Number(e.target.value))}
                  required
                />

                <Input
                  label="Expiry Date"
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  required
                />
              </div>

              <Select
                label="Status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>

              <div className="pt-2 flex justify-end gap-2">
                <Button onClick={() => setIsModalOpen(false)} variant="outline" size="md">Cancel</Button>
                <Button type="submit" variant="primary" size="md">Save Promo</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
