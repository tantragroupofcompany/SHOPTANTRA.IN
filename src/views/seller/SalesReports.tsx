import { useState, useEffect } from 'react';
import { Download, TrendingUp, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface ReportData {
  revenue: number;
  orders: number;
  productsSold: number;
  avgOrderValue: number;
}

interface CategorySales {
  category: string;
  revenue: number;
  percentage: number;
}

interface TopProduct {
  id: string;
  title: string;
  unitsSold: number;
  revenue: number;
}

interface OrderStatus {
  status: string;
  count: number;
}

const SalesReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reportData, setReportData] = useState<ReportData>({
    revenue: 0,
    orders: 0,
    productsSold: 0,
    avgOrderValue: 0,
  });
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<OrderStatus[]>([]);

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    setToDate(today.toISOString().split('T')[0]);
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fromDate && toDate) {
      fetchReportData();
    }
  }, [fromDate, toDate, user]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const res = await fetch(`/api/seller/sales-report?userId=${user.id}&fromDate=${fromDate}&toDate=${toDate}`);
      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          const data = resData.data;
          setReportData({
            revenue: data.revenue || 0,
            orders: data.orders || 0,
            productsSold: data.productsSold || 0,
            avgOrderValue: data.avgOrderValue || 0,
          });
          setCategorySales(data.categorySales || []);
          setTopProducts(data.topProducts || []);
          setOrderStatusData(data.orderStatusData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    try {
      const csv = [
        ['Sales Report', `From: ${fromDate} To: ${toDate}`],
        [],
        ['SUMMARY'],
        ['Total Revenue', `$${reportData.revenue.toFixed(2)}`],
        ['Total Orders', reportData.orders],
        ['Products Sold', reportData.productsSold],
        ['Avg Order Value', `$${reportData.avgOrderValue.toFixed(2)}`],
        [],
        ['TOP PRODUCTS'],
        ['Product', 'Units Sold', 'Revenue'],
        ...topProducts.map(p => [p.title, p.unitsSold, `$${p.revenue.toFixed(2)}`]),
      ];

      const csvContent = csv.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-report-${fromDate}-${toDate}.csv`;
      a.click();

      alert('Report exported successfully!');
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    }
  };

  if (loading && reportData.revenue === 0 && topProducts.length === 0) {
    return <div className="text-center py-12">Loading sales report...</div>;
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-600 mt-2">Analyze your sales performance and trends</p>
        </div>
        <Button
          onClick={handleExportReport}
          variant="outline"
          className="gap-2"
        >
          <Download size={18} />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={fetchReportData}
              className="w-full"
            >
              Generate Report
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Revenue"
          value={`$${reportData.revenue.toFixed(2)}`}
          icon={DollarSign}
          color="navy"
        />
        <StatCard
          title="Orders"
          value={reportData.orders}
          icon={ShoppingCart}
          color="green"
        />
        <StatCard
          title="Products Sold"
          value={reportData.productsSold}
          icon={Package}
          color="orange"
        />
        <StatCard
          title="Avg Order Value"
          value={`$${reportData.avgOrderValue.toFixed(2)}`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Category */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sales by Category</h2>
          {categorySales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data for selected period</p>
          ) : (
            <div className="space-y-4">
              {categorySales.map((cat, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    <span className="text-sm font-semibold text-gray-900">${cat.revenue.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Order Status Distribution */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h2>
          {orderStatusData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders</p>
          ) : (
            <div className="space-y-3">
              {orderStatusData.map((status, index) => {
                const total = orderStatusData.reduce((sum, s) => sum + s.count, 0);
                const percentage = (status.count / total) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm capitalize font-medium text-gray-700">
                        {status.status}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          status.status === 'delivered'
                            ? 'bg-green-500'
                            : status.status === 'shipped'
                            ? 'bg-blue-500'
                            : status.status === 'cancelled'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Top Products */}
      <Card className="p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Products</h2>
        {topProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No products sold in this period
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Product</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">Units Sold</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map(product => (
                <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{product.title}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-semibold text-gray-900">{product.unitsSold}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-gray-900">${product.revenue.toFixed(2)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

export default function SafeSalesReports() {
  return (
    <ErrorBoundary>
      <SalesReports />
    </ErrorBoundary>
  );
}
