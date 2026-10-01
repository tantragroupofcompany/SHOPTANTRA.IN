'use client';

/**
 * FOUNDER dashboard - live production data.
 *
 * This screen used to be a static placeholder: three cards showing an em dash and
 * the text "Founder controls placeholder. Connect backend APIs to populate live
 * metrics." Every number now comes from the existing, role-guarded
 * `/api/corporate/dashboard` endpoint, which queries the production database.
 *
 * Access is still gated by FounderGuard (client) AND by `requireRole` on the API
 * (server), so hiding the UI is never the control.
 */
import { useNavigate } from 'react-router-dom';
import {
  Users, Package, ShoppingCart, IndianRupee, Building2, CreditCard,
  UserCheck, PackageCheck,
} from 'lucide-react';
import ExecutiveDashboardShell, {
  MetricCard, Section, Rows, ListSection, RevenueByMonth,
} from '../executive/ExecutiveDashboardShell';
import { formatCurrency, formatCount } from '../../lib/executiveDashboard';

export default function FounderDashboard() {
  const navigate = useNavigate();

  return (
    <ExecutiveDashboardShell
      title="Founder Dashboard"
      subtitle="Full website control and executive oversight."
      onBack={() => navigate('/')}
    >
      {(d: any) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Users} label="Users" value={formatCount(d.totalUsers)} sub={`${formatCount(d.buyers.total)} buyers`} />
            <MetricCard icon={Package} label="Products" value={formatCount(d.marketplace.totalProducts)} sub={`${formatCount(d.marketplace.pendingProducts)} pending approval`} />
            <MetricCard icon={ShoppingCart} label="Orders" value={formatCount(d.company.totalOrders)} sub={`${formatCount(d.today.orders)} today`} />
            <MetricCard icon={IndianRupee} label="Revenue" value={formatCurrency(d.company.totalRevenue)} sub={`${formatCurrency(d.today.revenue)} today`} />
            <MetricCard icon={Building2} label="Sellers" value={formatCount(d.sellers.total)} sub={`${formatCount(d.sellers.approved)} approved`} />
            <MetricCard icon={CreditCard} label="Payments" value={formatCount(d.payments.totalPayments)} sub={`${formatCurrency(d.payments.totalCollected)} collected`} />
            <MetricCard icon={UserCheck} label="Seller approvals" value={formatCount(d.pendingApprovals.sellers)} sub="awaiting review" />
            <MetricCard icon={PackageCheck} label="Product approvals" value={formatCount(d.pendingApprovals.products)} sub="awaiting review" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Executive Overview">
              <Rows rows={[
                ['Total users', formatCount(d.totalUsers)],
                ['Buyers', formatCount(d.buyers.total)],
                ['Active buyers', formatCount(d.buyers.active)],
                ['New users today', formatCount(d.today.newUsers)],
                ['Categories', formatCount(d.marketplace.totalCategories)],
                ['Reviews', formatCount(d.business.totalReviews)],
              ]} />
            </Section>

            <Section title="Sellers">
              <Rows rows={[
                ['Total', formatCount(d.sellers.total)],
                ['Approved / active', formatCount(d.sellers.approved)],
                ['Pending', formatCount(d.sellers.pending)],
                ['Rejected', formatCount(d.sellers.rejected)],
                ['Suspended', formatCount(d.sellers.suspended)],
                ['Blocked', formatCount(d.sellers.blocked)],
                ['New today / week / month', `${formatCount(d.sellers.newToday)} / ${formatCount(d.sellers.newThisWeek)} / ${formatCount(d.sellers.newThisMonth)}`],
              ]} />
            </Section>

            <Section title="Products">
              <Rows rows={[
                ['Total', formatCount(d.marketplace.totalProducts)],
                ['Approved / listed', formatCount(d.marketplace.approvedProducts)],
                ['Pending approval', formatCount(d.marketplace.pendingProducts)],
                ['Rejected', formatCount(d.marketplace.rejectedProducts)],
                ['Blocked', formatCount(d.marketplace.blockedProducts)],
                ['Draft', formatCount(d.marketplace.draftProducts)],
                ['Out of stock', formatCount(d.marketplace.outOfStockProducts)],
                ['Units in stock', formatCount(d.marketplace.totalInventory)],
              ]} />
            </Section>

            <Section title="Orders">
              <Rows rows={[
                ['Total', formatCount(d.company.totalOrders)],
                ['Completed', formatCount(d.company.completedOrders)],
                ['Pending', formatCount(d.company.pendingOrders)],
                ['Cancelled', formatCount(d.company.cancelledOrders)],
                ['Refunded', formatCount(d.company.refundOrders)],
                ['Today', formatCount(d.today.orders)],
                ['Revenue this month', formatCurrency(d.company.monthlyRevenue)],
                ['Revenue this year', formatCurrency(d.company.yearlyRevenue)],
              ]} />
            </Section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Payments">
              <Rows rows={[
                ['Payment records', formatCount(d.payments.totalPayments)],
                ['Collected', formatCurrency(d.payments.totalCollected)],
                ['Razorpay (online)', formatCurrency(d.payments.razorpay)],
                ['COD (expected)', formatCurrency(d.payments.cod)],
                ['Other gateways', formatCurrency(d.payments.other)],
                ['Failed payments', formatCount(d.payments.failedPayments)],
                ['Refunded', formatCurrency(d.payments.refunds)],
                ['Payments today', formatCount(d.today.payments)],
              ]} />
            </Section>

            <Section title="Commission & Seller Payables">
              <Rows rows={[
                ['Commission collected', formatCurrency(d.payments.commissionCollected)],
                ['Platform commission (all states)', formatCurrency(d.finance.platformCommission)],
                ['Seller payable', formatCurrency(d.payments.sellerPayable)],
                ['Seller settled', formatCurrency(d.payments.sellerSettled)],
                ['Pending settlement', formatCurrency(d.payments.pendingSettlementTotal)],
                ['Failed transfers', formatCount(d.payments.failedTransferTotal)],
              ]} />
            </Section>

            <Section title="Shipping">
              <Rows rows={[
                ['Shipment records', formatCount(d.shipments.total)],
                ['Ready', formatCount(d.shipping.ready)],
                ['Packed', formatCount(d.shipping.packed)],
                ['Shipped', formatCount(d.shipping.shipped)],
                ['In transit', formatCount(d.shipping.inTransit)],
                ['Delivered', formatCount(d.shipping.delivered)],
                ['Returned', formatCount(d.shipping.returned)],
              ]} />
            </Section>

            <Section title="Support & Security">
              <Rows rows={[
                ['Open tickets', formatCount(d.support.open)],
                ['Pending tickets', formatCount(d.support.pending)],
                ['Resolved tickets', formatCount(d.support.resolved)],
                ['Corporate sessions', formatCount(d.security.corporateSessions)],
                ['Inactive buyers', formatCount(d.buyers.inactive)],
                ['Coupons', formatCount(d.business.totalCoupons)],
                ['JWT status', String(d.security.jwtStatus)],
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