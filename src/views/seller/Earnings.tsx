import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface Payout {
  id: string;
  amount: number;
  status: string;
  transaction_id: string;
  created_at: string;
}

interface SellerData {
  total_earned: number;
  available_balance: number;
  pending_payout: number;
  withdrawn: number;
  commission_rate: number;
}

const Earnings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<SellerData>({
    total_earned: 0,
    available_balance: 0,
    pending_payout: 0,
    withdrawn: 0,
    commission_rate: 15,
  });
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    fetchEarningsData();
  }, [user]);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const res = await fetch(`/api/seller/earnings?userId=${user.id}`);
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          setSellerData({
            total_earned: resData.data.total_earned || 0,
            available_balance: resData.data.available_balance || 0,
            pending_payout: resData.data.pending_payout || 0,
            withdrawn: resData.data.withdrawn || 0,
            commission_rate: resData.data.commission_rate || 15,
          });
          setPayouts(resData.data.payouts || []);
        }
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    try {
      setSubmittingPayout(true);

      if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      if (parseFloat(payoutAmount) > sellerData.available_balance) {
        alert('Payout amount exceeds available balance');
        return;
      }

      const res = await fetch('/api/seller/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          amount: parseFloat(payoutAmount),
          paymentMethod: paymentMethod === 'bank_transfer' ? 'BANK_TRANSFER' : 'UPI',
        })
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.success) {
          alert('Payout request submitted successfully');
          setPayoutAmount('');
          setPaymentMethod('bank_transfer');
          setShowPayoutModal(false);
          fetchEarningsData();
        } else {
          alert(resData.error || 'Failed to request payout');
        }
      } else {
        const resData = await res.json();
        alert(resData.error || 'Failed to request payout');
      }
    } catch (error) {
      console.error('Error requesting payout:', error);
      alert('Failed to request payout');
    } finally {
      setSubmittingPayout(false);
    }
  };

  const getMonthlyEarnings = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const data = [2400, 3200, 2800, 3600, 4100, 3800];
    const maxValue = Math.max(...data);

    return months.map((month, index) => ({
      month,
      value: data[index],
      percentage: (data[index] / maxValue) * 100,
    }));
  };

  if (loading) {
    return <div className="text-center py-12">Loading earnings data...</div>;
  }

  const monthlyData = getMonthlyEarnings();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings & Payouts</h1>
          <p className="text-gray-600 mt-2">Manage your earnings and payment information</p>
        </div>
        <Button
          onClick={() => setShowPayoutModal(true)}
          className="gap-2 bg-orange-500 hover:bg-orange-600"
        >
          <CreditCard size={18} />
          Request Payout
        </Button>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Earned"
          value={`$${sellerData.total_earned.toFixed(2)}`}
          icon={DollarSign}
          color="navy"
        />
        <StatCard
          title="Available Balance"
          value={`$${sellerData.available_balance.toFixed(2)}`}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Pending Payout"
          value={`$${sellerData.pending_payout.toFixed(2)}`}
          icon={Calendar}
          color="orange"
        />
        <StatCard
          title="Withdrawn"
          value={`$${sellerData.withdrawn.toFixed(2)}`}
          icon={CreditCard}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Earnings Chart */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Earnings</h2>
          <div className="space-y-4">
            {monthlyData.map(month => (
              <div key={month.month}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{month.month}</span>
                  <span className="text-sm font-semibold text-gray-900">${month.value}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${month.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Commission Breakdown */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Breakdown</h2>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Commission Rate</p>
              <p className="text-2xl font-bold text-blue-600">{sellerData.commission_rate}%</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Est. Monthly Earnings</p>
              <p className="text-2xl font-bold text-green-600">
                ${((sellerData.total_earned / 12) * (1 - sellerData.commission_rate / 100)).toFixed(2)}
              </p>
            </div>

            <div className="text-xs text-gray-500 mt-4 p-3 bg-gray-50 rounded-lg">
              <p>Your earnings are calculated after deducting the platform commission of {sellerData.commission_rate}%.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payout History */}
      <Card className="p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No payouts yet. Request your first payout to get started.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(payout => (
                <tr key={payout.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ${payout.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      payout.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : payout.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-sm">{payout.transaction_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Payout Modal */}
      <Modal
        isOpen={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        title="Request Payout"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">$</span>
              <Input
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Available balance: ${sellerData.available_balance.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe Connect</option>
            </Select>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowPayoutModal(false)}
              disabled={submittingPayout}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestPayout}
              disabled={submittingPayout}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {submittingPayout ? 'Processing...' : 'Request Payout'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function SafeEarnings() {
  return (
    <ErrorBoundary>
      <Earnings />
    </ErrorBoundary>
  );
}
