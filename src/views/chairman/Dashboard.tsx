'use client';

/**
 * CHAIRMAN dashboard - live production data.
 *
 * Replaced a static placeholder that rendered an em dash and "Chairman controls
 * placeholder. Connect backend APIs to populate live metrics." It now reads the
 * existing role-guarded `/api/corporate/dashboard` endpoint, which queries the
 * production database, and presents the management/financial view for CHAIRMAN.
 *
 * Gated by ChairmanGuard (client) and `requireRole` (server).
 */
import { useNavigate } from 'react-router-dom';
import {
  PieChart, DollarSign, Users, FileText, ShoppingCart, CreditCard, Building2,
  RotateCcw, Lock, UserCheck, PackageCheck,
} from 'lucide-react';
import ExecutiveDashboardShell, {
  Section, Rows, ListSection, RevenueByMonth,
} from '../executive/ExecutiveDashboardShell';
import MetricCard from '../executive/MetricCard';
import { useOpenDetail } from '../executive/ExecutiveShell';
import { formatCurrency, formatCount } from '../../lib/executiveDashboard';

export default function ChairmanDashboard() {
  const navigate = useNavigate();
  // Every card opens a real detail panel backed by a role-guarded endpoint.
  const open = useOpenDetail();

  return (
    <ExecutiveDashboardShell
      title="Chairman Dashboard"
      subtitle="Management, financial reports, and analytics."
      onBack={() => navigate('/')}
    >
      {(d: any) => (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard icon={DollarSign} label="Revenue" value={formatCurrency(d.company.totalRevenue)} sub={`${formatCurrency(d.company.monthlyRevenue)} this month`} onOpen={() => open('payments')} />
            <MetricCard icon={PieChart} label="Gross sales" value={formatCurrency(d.finance.grossSales)} sub="paid + COD expected" onOpen={() => open('payments')} />
            <MetricCard icon={CreditCard} label="Platform commission" value={formatCurrency(d.finance.platformCommission)} sub={`${formatCurrency(d.payments.commissionCollected)} collected`} onOpen={() => open('commission')} />
            <MetricCard icon={ShoppingCart} label="Orders" value={formatCount(d.company.totalOrders)} sub={`${formatCount(d.company.completedOrders)} completed`} onOpen={() => open('orders')} />
            <MetricCard icon={Users} label="Stakeholders" value={formatCount(d.totalUsers)} sub={`${formatCount(d.buyers.total)} buyers`} onOpen={() => open('users')} />
            <MetricCard icon={Building2} label="Sellers" value={formatCount(d.sellers.total)} sub={`${formatCount(d.sellers.approved)} approved`} onOpen={() => open('sellers')} />
            <MetricCard icon={FileText} label="Products" value={formatCount(d.marketplace.totalProducts)} sub={`${formatCount(d.marketplace.pendingProducts)} pending`} onOpen={() => open('products')} />
            <MetricCard icon={DollarSign} label="Seller payable" value={formatCurrency(d.finance.sellerPayable)} sub={`${formatCurrency(d.finance.sellerSettled)} settled`} onOpen={() => open('settlements')} />
            <MetricCard icon={RotateCcw} label="Refunds" value={formatCurrency(d.finance.refunds)} sub="refunded to buyers" onOpen={() => open('payments')} />
            <MetricCard icon={Lock} label="Security" value={String(d.security.jwtStatus)} sub={`${formatCount(d.security.corporateSessions)} sessions`} />
            <MetricCard icon={UserCheck} label="Seller approvals" value={formatCount(d.pendingApprovals.sellers)} sub="awaiting review" onOpen={() => navigate('/corporate/sellers')} />
            <MetricCard icon={PackageCheck} label="Product approvals" value={formatCount(d.pendingApprovals.products)} sub="awaiting review" onOpen={() => navigate('/corporate/products')} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="Business Overview">
              <Rows rows={[
                ['Total users', formatCount(d.totalUsers)],
                ['Buyers', formatCount(d.buyers.total)],
                ['Active buyers', formatCount(d.buyers.active)],
                ['Sellers', formatCount(d.sellers.total)],
                ['Products', formatCount(d.marketplace.totalProducts)],
                ['Categories', formatCount(d.marketplace.totalCategories)],
                ['Reviews', formatCount(d.business.totalReviews)],
              ]} />
            </Section>

            <Section title="Financials">
              <Rows rows={[
                ['Gross sales', formatCurrency(d.finance.grossSales)],
                ['Revenue (all time)', formatCurrency(d.company.totalRevenue)],
                ['Revenue this month', formatCurrency(d.company.monthlyRevenue)],
                ['Revenue this year', formatCurrency(d.company.yearlyRevenue)],
                ['Platform commission', formatCurrency(d.finance.platformCommission)],
                ['Commission collected', formatCurrency(d.finance.commissionCollected)],
                ['Refunds', formatCurrency(d.finance.refunds)],
              ]} />
            </Section>

            <Section title="Seller Settlement">
              <Rows rows={[
                ['Seller payable', formatCurrency(d.finance.sellerPayable)],
                ['Seller settled', formatCurrency(d.finance.sellerSettled)],
                ['Pending settlement', formatCurrency(d.finance.pendingSettlement)],
                ['Failed transfers (count)', formatCount(d.payments.failedTransferTotal)],
                ['Commission rules applied', formatCurrency(d.payments.commissionCollected)],
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
              ]} />
            </Section>

            <Section title="Orders & Risk">
              <Rows rows={[
                ['Total orders', formatCount(d.company.totalOrders)],
                ['Completed', formatCount(d.company.completedOrders)],
                ['Pending', formatCount(d.company.pendingOrders)],
                ['Cancelled', formatCount(d.company.cancelledOrders)],
                ['Refunded', formatCount(d.company.refundOrders)],
                ['Returned shipments', formatCount(d.shipping.returned)],
              ]} />
            </Section>

            <Section title="Governance & Security">
              <Rows rows={[
                ['Corporate sessions', formatCount(d.security.corporateSessions)],
                ['JWT status', String(d.security.jwtStatus)],
                ['Seller approvals pending', formatCount(d.pendingApprovals.sellers)],
                ['Product approvals pending', formatCount(d.pendingApprovals.products)],
                ['Coupons', formatCount(d.business.totalCoupons)],
                ['Open support tickets', formatCount(d.support.open)],
              ]} />
            </Section>
          </div>

          <Section title="Revenue by month">
            <RevenueByMonth rows={d.analytics.revenueByMonth} />
          </Section>

          <ListSection
            title="Top categories by product count"
            empty="No categories recorded yet."
            rows={(d.analytics.topCategories || []).slice(0, 10).map((c: any) => ({
              id: c.name, label: c.name, value: formatCount(c.productCount),
            }))}
          />

          <ListSection
            title="Top products by sales"
            empty="No product sales recorded yet."
            rows={(d.analytics.topProducts || []).slice(0, 10).map((p: any) => ({
              id: p.id, label: `${p.title} (${formatCount(p.soldCount)} sold)`, value: formatCurrency(p.sales),
            }))}
          />
        </>
      )}
    </ExecutiveDashboardShell>
  );
}