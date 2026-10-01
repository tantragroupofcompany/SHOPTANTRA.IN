'use client';

/**
 * CEO & MD dashboard - live production data.
 *
 * Replaced a static placeholder that rendered an em dash and "CEO & MD controls
 * placeholder. Connect backend APIs to populate live metrics." It now reads the
 * existing role-guarded `/api/corporate/dashboard` endpoint, which queries the
 * production database, and shows the operations/sales view appropriate to CEO_MD.
 *
 * Gated by CEOGuard (client) and `requireRole` (server).
 */
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Package, ShoppingCart, IndianRupee, Building2, CreditCard, Truck,
} from 'lucide-react';
import ExecutiveDashboardShell, {
  MetricCard, Section, Rows, ListSection, RevenueByMonth,
} from '../executive/ExecutiveDashboardShell';
import { formatCurrency, formatCount } from '../../lib/executiveDashboard';

export default function CEODashboard() {
  const navigate = useNavigate();

  return (
    <ExecutiveDashboardShell
      title="CEO & MD Dashboard"
      subtitle="Operations, sales, orders, and performance."
      onBack={() => navigate('/')}
    >
      {(d: any) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={BarChart3} label="Orders" value={formatCount(d.company.totalOrders)} sub={`${formatCount(d.today.orders)} today`} />
            <MetricCard icon={IndianRupee} label="Revenue" value={formatCurrency(d.company.totalRevenue)} sub={`${formatCurrency(d.today.revenue)} today`} />
            <MetricCard icon={Package} label="Products" value={formatCount(d.marketplace.totalProducts)} sub={`${formatCount(d.marketplace.outOfStockProducts)} out of stock`} />
            <MetricCard icon={ShoppingCart} label="Buyers" value={formatCount(d.buyers.total)} sub={`${formatCount(d.today.newBuyers)} new today`} />
            <MetricCard icon={Building2} label="Sellers" value={formatCount(d.sellers.total)} sub={`${formatCount(d.sellers.pending)} pending`} />
            <MetricCard icon={CreditCard} label="Payments today" value={formatCount(d.today.payments)} sub={`${formatCurrency(d.payments.totalCollected)} collected`} />
            <MetricCard icon={Truck} label="Shipments" value={formatCount(d.shipments.total)} sub={`${formatCount(d.shipping.shipped)} shipped`} />
            <MetricCard icon={BarChart3} label="Commission" value={formatCurrency(d.payments.commissionCollected)} sub="collected" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Sales & Revenue">
              <Rows rows={[
                ['Revenue (all time)', formatCurrency(d.company.totalRevenue)],
                ['Revenue this month', formatCurrency(d.company.monthlyRevenue)],
                ['Revenue this year', formatCurrency(d.company.yearlyRevenue)],
                ['Revenue today', formatCurrency(d.today.revenue)],
                ['Orders total', formatCount(d.company.totalOrders)],
                ['Orders today', formatCount(d.today.orders)],
                ['Completed', formatCount(d.company.completedOrders)],
                ['Pending', formatCount(d.company.pendingOrders)],
                ['Cancelled', formatCount(d.company.cancelledOrders)],
              ]} />
            </Section>

            <Section title="Operations">
              <Rows rows={[
                ['Shipment records', formatCount(d.shipments.total)],
                ['Ready', formatCount(d.shipping.ready)],
                ['Packed', formatCount(d.shipping.packed)],
                ['Shipped', formatCount(d.shipping.shipped)],
                ['In transit', formatCount(d.shipping.inTransit)],
                ['Delivered', formatCount(d.shipping.delivered)],
                ['Returned', formatCount(d.shipping.returned)],
                ['Open support tickets', formatCount(d.support.open)],
              ]} />
            </Section>

            <Section title="Payments">
              <Rows rows={[
                ['Payment records', formatCount(d.payments.totalPayments)],
                ['Collected', formatCurrency(d.payments.totalCollected)],
                ['Razorpay (online)', formatCurrency(d.payments.razorpay)],
                ['COD (expected)', formatCurrency(d.payments.cod)],
                ['Failed payments', formatCount(d.payments.failedPayments)],
                ['Refunded', formatCurrency(d.payments.refunds)],
                ['Payments today', formatCount(d.today.payments)],
              ]} />
            </Section>

            <Section title="Seller & Product Activity">
              <Rows rows={[
                ['Sellers total', formatCount(d.sellers.total)],
                ['Sellers approved', formatCount(d.sellers.approved)],
                ['Sellers pending', formatCount(d.sellers.pending)],
                ['Sellers suspended', formatCount(d.sellers.suspended)],
                ['Products total', formatCount(d.marketplace.totalProducts)],
                ['Products approved', formatCount(d.marketplace.approvedProducts)],
                ['Products pending', formatCount(d.marketplace.pendingProducts)],
                ['Out of stock', formatCount(d.marketplace.outOfStockProducts)],
              ]} />
            </Section>
          </div>

          <Section title="Revenue by month">
            <RevenueByMonth rows={d.analytics.revenueByMonth} />
          </Section>

          <ListSection
            title="Top products by sales"
            empty="No product sales recorded yet."
            rows={(d.analytics.topProducts || []).slice(0, 10).map((p: any) => ({
              id: p.id, label: `${p.title} (${formatCount(p.soldCount)} sold)`, value: formatCurrency(p.sales),
            }))}
          />

          <ListSection
            title="Recent orders"
            empty="No orders yet."
            rows={(d.recentOrders || []).slice(0, 10).map((o: any) => ({
              id: o.id, label: o.orderNumber || o.id, value: `${formatCurrency(o.totalAmount)} - ${o.status || 'PENDING'}`,
            }))}
          />
        </>
      )}
    </ExecutiveDashboardShell>
  );
}