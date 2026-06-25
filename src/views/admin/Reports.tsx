import { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Input } from '../../components/ui/Input';
import { Download, Calendar, DollarSign, Store, ShoppingBag, Users, ArrowUpRight, Loader2 } from 'lucide-react';

export default function AdminReports() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState<'revenue' | 'sellers' | 'customers' | 'orders'>('revenue');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch report data from database API
  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/reports?type=${reportType}&from=${dateFrom}&to=${dateTo}`);
        const result = await res.json();
        if (result.success) {
          setReportData(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, [reportType, dateFrom, dateTo]);

  // Aggregate totals dynamically from database rows
  const aggregates = useMemo(() => {
    if (reportType === 'revenue' || reportType === 'sellers') {
      const totalRevenue = reportData.reduce((sum, r) => sum + (r.revenue || 0), 0);
      const totalOrders = reportType === 'revenue' ? reportData.reduce((sum, r) => sum + (r.ordersCount || 0), 0) : 0;
      const totalCommissions = reportData.reduce((sum, r) => sum + (r.commissionEarned || 0), 0);
      const avgOrderVal = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      return { totalRevenue, totalOrders, totalCommissions, avgOrderVal };
    } else if (reportType === 'orders') {
      const totalRevenue = reportData.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
      const totalOrders = reportData.length;
      const totalCommissions = reportData.reduce((sum, r) => sum + (r.commissionAmount || 0), 0);
      const avgOrderVal = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      return { totalRevenue, totalOrders, totalCommissions, avgOrderVal };
    } else { // customers
      const totalRevenue = reportData.reduce((sum, r) => sum + (r.totalSpent || 0), 0);
      const totalOrders = reportData.reduce((sum, r) => sum + (r.ordersCount || 0), 0);
      const totalCommissions = Math.round(totalRevenue * 0.10); // 10% platform fee estimate
      const avgOrderVal = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      return { totalRevenue, totalOrders, totalCommissions, avgOrderVal };
    }
  }, [reportData, reportType]);

  // Export report to CSV/Excel (UTF-8 BOM added for Excel compatibility)
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'revenue') {
      headers = ['Billing Date', 'Orders Fulfilled', 'Gross Revenue (INR)', 'Avg Order Value (INR)', 'Commission Earned (INR)'];
      rows = reportData.map(row => [
        row.date,
        String(row.ordersCount),
        String(row.revenue),
        String(row.avgOrderValue),
        String(row.commissionEarned)
      ]);
    } else if (reportType === 'sellers') {
      headers = ['Billing Date', 'Active Sellers Count', 'Gross Volume (INR)', 'Settled Payouts (INR)', 'Platform Commission (INR)'];
      rows = reportData.map(row => [
        row.date,
        String(row.sellersCount),
        String(row.revenue),
        String(row.revenue - row.commissionEarned),
        String(row.commissionEarned)
      ]);
    } else if (reportType === 'customers') {
      headers = ['Customer Name', 'Email Address', 'Mobile Number', 'Orders Placed', 'Total Spent (INR)'];
      rows = reportData.map(row => [
        row.name,
        row.email,
        row.phone,
        String(row.ordersCount),
        String(row.totalSpent)
      ]);
    } else { // orders
      headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Mobile', 'Seller Store', 'Items Count', 'Total Amount (INR)', 'Commission Amount (INR)', 'Status', 'Payment Status', 'Tracking Number', 'Courier Partner'];
      rows = reportData.map(row => [
        row.orderNumber,
        row.date,
        row.customerName,
        row.customerEmail,
        row.customerMobile,
        row.sellerName,
        String(row.itemsCount),
        String(row.totalAmount),
        String(row.commissionAmount),
        row.status,
        row.paymentStatus,
        row.trackingNumber,
        row.carrier
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `shoptantra_${reportType}_report_${dateFrom}_to_${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Audit Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Export tax ledger reports, seller settlement sheets, and operational sales volumes.
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="primary" size="md" icon={<Download size={16} />} disabled={loading || reportData.length === 0}>
          Export CSV / Excel
        </Button>
      </div>

      {/* Date Filters & Type Selector */}
      <Card className="p-6 border border-gray-150/40 dark:border-brand-navy-light/10 bg-white dark:bg-brand-navy">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as any)}
          >
            <option value="revenue">Revenue & Commissions</option>
            <option value="sellers">Sellers Activity</option>
            <option value="customers">Customer Purchasing</option>
            <option value="orders">Orders & Invoices Log</option>
          </Select>

          <Input
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />

          <Input
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card className="p-6 border border-gray-150/40 dark:border-brand-navy-light/10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Gross merchandise Volume</span>
              <span className="text-2xl font-black block mt-2 text-gray-900 dark:text-white">₹{aggregates.totalRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
              <DollarSign size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-150/40 dark:border-brand-navy-light/10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Platform Commission</span>
              <span className="text-2xl font-black block mt-2 text-gray-900 dark:text-white">₹{aggregates.totalCommissions.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
              <ArrowUpRight size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-150/40 dark:border-brand-navy-light/10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Orders Processed</span>
              <span className="text-2xl font-black block mt-2 text-gray-900 dark:text-white">{aggregates.totalOrders}</span>
            </div>
            <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
              <ShoppingBag size={20} />
            </div>
          </div>
        </Card>

        <Card className="p-6 border border-gray-150/40 dark:border-brand-navy-light/10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Avg Order Value</span>
              <span className="text-2xl font-black block mt-2 text-gray-900 dark:text-white">₹{aggregates.avgOrderVal.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2 bg-brand-orange/10 rounded-lg text-brand-orange">
              <Users size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Report Table */}
      <Card className="overflow-hidden border border-gray-150/40 dark:border-brand-navy-light/10">
        <div className="p-4 bg-gray-50 dark:bg-brand-navy-dark border-b border-gray-150/40 dark:border-brand-navy-light/10 flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">
            {reportType === 'revenue' && 'Daily Sales & Commissions Ledger'}
            {reportType === 'sellers' && 'Vendor Activity & Retention Logs'}
            {reportType === 'customers' && 'Customer Lifetime Value Ledger'}
            {reportType === 'orders' && 'E-Commerce Transactions Ledger'}
          </h2>
          <span className="text-xs text-brand-orange font-semibold flex items-center gap-1">
            <Calendar size={12} />
            {dateFrom} to {dateTo}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 gap-2 text-gray-500">
            <Loader2 className="animate-spin w-5 h-5 text-brand-orange" />
            Loading report ledger...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-brand-navy border-b border-gray-150/40 dark:border-brand-navy-light/10 text-gray-500 dark:text-gray-400 font-bold">
                  {reportType === 'revenue' && (
                    <>
                      <th className="p-4">Billing Date</th>
                      <th className="p-4">Orders Fulfilled</th>
                      <th className="p-4">Gross Revenue</th>
                      <th className="p-4">Avg Order Value</th>
                      <th className="p-4">Commission Earned</th>
                    </>
                  )}
                  {reportType === 'sellers' && (
                    <>
                      <th className="p-4">Billing Date</th>
                      <th className="p-4">Active Sellers</th>
                      <th className="p-4">Gross Volume</th>
                      <th className="p-4">Settled Payouts</th>
                      <th className="p-4">Platform commission</th>
                    </>
                  )}
                  {reportType === 'customers' && (
                    <>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Orders Placed</th>
                      <th className="p-4">Total Spent</th>
                    </>
                  )}
                  {reportType === 'orders' && (
                    <>
                      <th className="p-4">Order #</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Customer Name</th>
                      <th className="p-4">Seller Store</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Payment</th>
                      <th className="p-4">Shipping Status</th>
                      <th className="p-4">Tracking Number</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-brand-navy-light/10">
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-400 dark:text-gray-500">
                      No records found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={row.id || row.date || idx} className="hover:bg-gray-50/50 dark:hover:bg-brand-navy-light/5 transition-colors">
                      {reportType === 'revenue' && (
                        <>
                          <td className="p-4 font-bold text-gray-800 dark:text-gray-100">{row.date}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{row.ordersCount} sales</td>
                          <td className="p-4 font-extrabold text-gray-800 dark:text-gray-200">₹{row.revenue.toLocaleString('en-IN')}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">₹{row.avgOrderValue.toLocaleString('en-IN')}</td>
                          <td className="p-4 font-extrabold text-brand-orange">₹{row.commissionEarned.toLocaleString('en-IN')}</td>
                        </>
                      )}
                      {reportType === 'sellers' && (
                        <>
                          <td className="p-4 font-bold text-gray-800 dark:text-gray-100">{row.date}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{row.sellersCount} merchants</td>
                          <td className="p-4 font-extrabold text-gray-800 dark:text-gray-200">₹{row.revenue.toLocaleString('en-IN')}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">₹{(row.revenue - row.commissionEarned).toLocaleString('en-IN')}</td>
                          <td className="p-4 font-extrabold text-brand-orange">₹{row.commissionEarned.toLocaleString('en-IN')}</td>
                        </>
                      )}
                      {reportType === 'customers' && (
                        <>
                          <td className="p-4 font-bold text-gray-800 dark:text-gray-100">{row.name}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{row.email}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{row.phone}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{row.ordersCount} orders</td>
                          <td className="p-4 font-extrabold text-gray-800 dark:text-gray-200">₹{row.totalSpent.toLocaleString('en-IN')}</td>
                        </>
                      )}
                      {reportType === 'orders' && (
                        <>
                          <td className="p-4 font-bold text-gray-850 dark:text-gray-100">{row.orderNumber}</td>
                          <td className="p-4 font-semibold text-gray-600 dark:text-gray-300">{row.date}</td>
                          <td className="p-4 text-gray-700 dark:text-gray-350">{row.customerName}</td>
                          <td className="p-4 text-gray-700 dark:text-gray-350">{row.sellerName}</td>
                          <td className="p-4 font-extrabold text-gray-850 dark:text-gray-200">₹{row.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {row.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="capitalize font-semibold">{row.status.toLowerCase()}</span>
                          </td>
                          <td className="p-4 font-mono text-[11px] font-bold text-gray-600 dark:text-gray-400">
                            {row.trackingNumber !== 'N/A' ? row.trackingNumber : 'Pending dispatch'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

    </div>
  );
}
