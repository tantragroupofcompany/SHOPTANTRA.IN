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
  Package, ShoppingCart, IndianRupee, Building2, CreditCard, Truck,
  Users, Percent, Wallet, Clock, UserCheck, PackageCheck,
} from 'lucide-react';
import ExecutiveDashboardShell, {
  Section, Rows, ListSection, RevenueByMonth,
} from '../executive/ExecutiveDashboardShell';
import MetricCard from '../executive/MetricCard';
import { useOpenDetail } from '../executive/ExecutiveShell';
import { formatCurrency, formatCount } from '../../lib/executiveDashboard';

export default function CEODashboard() {
  const navigate = useNavigate();
  // Every card opens a real detail panel backed by a role-guarded endpoint.
  const open = useOpenDetail();

  return (
    <ExecutiveDashboardShell
      title="CEO & MD Dashboard"
      subtitle="Operations, sales, orders, and performance."
      onBack={() => navigate('/')}
    >
      {(d: any) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard icon={ShoppingCart} label="Orders" value={formatCount(d.company.totalOrders)} sub={`${formatCount(d.today.orders)} today`} onOpen={() => open('orders')} />
            <MetricCard icon={IndianRupee} label="Revenue" value={formatCurrency(d.company.totalRevenue)} sub={`${formatCurrency(d.today.revenue)} today`} onOpen={() => open('payments')} />
            <MetricCard icon={Package} label="Products" value={formatCount(d.marketplace.totalProducts)} sub={`${formatCount(d.marketplace.outOfStockProducts)} out of stock`} onOpen={() => open('products')} />
            <MetricCard icon={Users} label="Buyers" value={formatCount(d.buyers.total)} sub={`${formatCount(d.today.newBuyers)} new today`} onOpen={() => open('users')} />
            <MetricCard icon={Building2} label="Sellers" value={formatCount(d.sellers.total)} sub={`${formatCount(d.sellers.pending)} pending`} onOpen={() => open('sellers')} />
            <MetricCard icon={CreditCard} label="Payments" value={formatCount(d.payments.totalPayments)} sub={`${formatCurrency(d.payments.totalCollected)} collected`} onOpen={() => open('payments')} />
            <MetricCard icon={Percent} label="Commission" value={formatCurrency(d.payments.commissionCollected)} sub="collected" onOpen={() => open('commission')} />
            <MetricCard icon={Wallet} label="Settlements" value={formatCurrency(d.payments.sellerPayable)} sub="seller payable" onOpen={() => open('settlements')} />
            <MetricCard icon={Clock} label="Pending orders" value={formatCount(d.company.pendingOrders)} sub="to fulfil" onOpen={() => open('orders')} />
            <MetricCard icon={Truck} label="Shipments" value={formatCount(d.shipments.total)} sub={`${formatCount(d.shipping.shipped)} shipped`} onOpen={() => open('orders')} />
            <MetricCard icon={UserCheck} label="Seller approvals" value={formatCount(d.sellers.pending)} sub="awaiting review" onOpen={() => navigate('/corporate/sellers')} />
            <MetricCard icon={PackageCheck} label="Product approvals" value={formatCount(d.marketplace.pendingProducts)} sub="awaiting review" onOpen={() => navigate('/corporate/products')} />
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