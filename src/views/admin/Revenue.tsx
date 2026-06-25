import React, { useEffect, useState } from 'react';
import { BarChart3, Download, Filter } from 'lucide-react';
import Card, { StatCard } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { supabase } from '../../lib/supabase';

interface RevenueData {
  totalRevenue: number;
  monthRevenue: number;
  weekRevenue: number;
  dayRevenue: number;
  commissionEarnings: number;
  sellerPayouts: number;
}

interface RevenueTransaction {
  id: string;
  date: string;
  order_id: string;
  seller_name: string;
  amount: number;
  commission: number;
  status: 'completed' | 'pending' | 'failed';
}

const Revenue = () => {
  const [stats, setStats] = useState<RevenueData>({
    totalRevenue: 0,
    monthRevenue: 0,
    weekRevenue: 0,
    dayRevenue: 0,
    commissionEarnings: 0,
    sellerPayouts: 0,
  });

  const [transactions, setTransactions] = useState<RevenueTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>('current');

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);

      const analyticsRes = await fetch('/api/analytics');
      const analyticsData = await analyticsRes.json();

      const reportsRes = await fetch('/api/admin/reports?type=orders');
      const reportsData = await reportsRes.json();

      if (analyticsData.success) {
        const rev = analyticsData.data.revenue;
        const totalRev = rev.totalRevenue || 0;
        
        let totalComm = 0;
        try {
          const sellerRes = await fetch('/api/admin/sellers/analytics');
          const sellerData = await sellerRes.json();
          if (sellerData.success) {
            totalComm = sellerData.data.reduce((sum: number, s: any) => sum + s.commission, 0);
          } else {
            totalComm = Math.floor(totalRev * 0.10);
          }
        } catch (e) {
          totalComm = Math.floor(totalRev * 0.10);
        }

        setStats({
          totalRevenue: totalRev,
          monthRevenue: rev.monthlyRevenue || 0,
          weekRevenue: rev.weeklyRevenue || 0,
          dayRevenue: rev.dailyRevenue || 0,
          commissionEarnings: totalComm,
          sellerPayouts: totalRev - totalComm,
        });
      }

      if (reportsData.success) {
        const formattedTransactions = (reportsData.data || []).slice(0, 20).map((order: any) => ({
          id: order.id,
          date: order.date,
          order_id: order.orderNumber,
          seller_name: order.sellerName || 'Partner Merchant',
          amount: order.totalAmount || 0,
          commission: order.commissionAmount || 0,
          status: order.status,
        }));

        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyChartData = () => {
    return [
      { month: 'Jan', value: 4200 },
      { month: 'Feb', value: 3800 },
      { month: 'Mar', value: 5200 },
      { month: 'Apr', value: 4800 },
      { month: 'May', value: 6200 },
      { month: 'Jun', value: 7100 },
      { month: 'Jul', value: 6800 },
      { month: 'Aug', value: 7500 },
      { month: 'Sep', value: 6900 },
      { month: 'Oct', value: 8100 },
      { month: 'Nov', value: 8800 },
      { month: 'Dec', value: 9200 },
    ];
  };

  const getPlanBreakdown = () => {
    return [
      { name: 'Basic', revenue: 15000, percentage: 25 },
      { name: 'Professional', revenue: 30000, percentage: 50 },
      { name: 'Enterprise', revenue: 15000, percentage: 25 },
    ];
  };

  const monthlyData = getMonthlyChartData();
  const maxValue = Math.max(...monthlyData.map((d) => d.value));
  const planBreakdown = getPlanBreakdown();

  const handleExportReport = () => {
    const csv = 'Date,Order ID,Seller,Amount,Commission,Status\n' +
      transactions.map((t) => `${t.date},${t.order_id},${t.seller_name},${t.amount},${t.commission},${t.status}`).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading revenue data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
          <p className="text-gray-600 mt-2">Track platform revenue and earnings</p>
        </div>
        <Button onClick={handleExportReport} icon={<Download className="w-4 h-4" />}>
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          icon={<BarChart3 className="w-6 h-6" />}
          trend="All time"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={<BarChart3 className="w-6 h-6" />}
          trend="All time"
        />
        <StatCard
          title="This Month"
          value={`₹${stats.monthRevenue.toLocaleString('en-IN')}`}
          icon={<BarChart3 className="w-6 h-6" />}
          trend="Active month sales"
        />
        <StatCard
          title="This Week"
          value={`₹${stats.weekRevenue.toLocaleString('en-IN')}`}
          icon={<BarChart3 className="w-6 h-6" />}
          trend="Active week sales"
        />
        <StatCard
          title="Today"
          value={`₹${stats.dayRevenue.toLocaleString('en-IN')}`}
          icon={<BarChart3 className="w-6 h-6" />}
          trend="Active daily sales"
        />
      </div>

      {/* Commission vs Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission vs Payouts</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Platform Commission</span>
                <span className="text-lg font-semibold text-orange-600">
                  ₹{stats.commissionEarnings.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: '10%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Seller Payouts</span>
                <span className="text-lg font-semibold text-blue-600">
                  ₹{stats.sellerPayouts.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: '90%' }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Revenue by Plan */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h2>
          <div className="space-y-4">
            {planBreakdown.map((plan, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">{plan.name}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ₹{plan.revenue.toLocaleString('en-IN')} ({plan.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Monthly Comparison Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Monthly Comparison</h2>
        <div className="flex items-end justify-around h-64 gap-1">
          {monthlyData.map((data, idx) => (
            <div key={idx} className="flex flex-col items-center w-full">
              <div
                className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t transition-all hover:shadow-lg"
                style={{
                  height: `${(data.value / maxValue) * 200}px`,
                }}
              />
              <span className="text-xs text-gray-600 mt-2">{data.month}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 text-sm text-gray-600 text-center border-t pt-4">
          Average Monthly Revenue: ₹{(monthlyData.reduce((a, b) => a + b.value, 0) / 12).toFixed(0)}
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="w-auto">
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="all">All Time</option>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Seller</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Amount</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Commission</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{transaction.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{transaction.order_id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{transaction.seller_name}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900">
                    ₹{transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-orange-600">
                    ₹{transaction.commission.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        transaction.status === 'completed' || transaction.status === 'confirmed' || transaction.status === 'shipped' || transaction.status === 'delivered'
                          ? 'success'
                          : transaction.status === 'pending'
                          ? 'warning'
                          : 'error'
                      }
                    >
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No transactions found.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Revenue;
