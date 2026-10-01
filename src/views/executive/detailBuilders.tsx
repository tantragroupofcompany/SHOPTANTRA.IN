/**
 * Maps every interactive dashboard card to a REAL, already-role-guarded
 * corporate endpoint, and declares the columns to render.
 *
 * Centralising this means no card can point at a route that does not exist (no
 * dead buttons), and every detail view reads the same live production data as
 * the board it was opened from.
 *
 * Endpoints used (all `requireRole(['FOUNDER','CEO_MD','CHAIRMAN'])`):
 *   /api/corporate/customers   ?status=all|active|inactive
 *   /api/corporate/sellers     ?status=all|approved|pending|rejected|suspended|blocked
 *   /api/corporate/products    ?status=all|approved|pending|rejected|blocked|draft|outofstock
 *   /api/corporate/orders      ?status=all|pending|completed|cancelled|refunded
 *   /api/corporate/finance     ?view=payments|commission|settlements
 *
 * No endpoint is invented for a card with no underlying data, and no value is
 * hardcoded: the panel only ever renders rows the server returned.
 */
import type { DetailRequest } from './ExecutiveDetailPanel';
import { formatCount, formatCurrency } from '../../lib/executiveDashboard';

const date = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const badge = (v?: string | null) => (
  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-gray-200 whitespace-nowrap">
    {v || '—'}
  </span>
);

export const DETAIL_BUILDERS: Record<string, () => DetailRequest> = {
  users: () => ({
    url: '/api/corporate/customers',
    title: 'Users / Buyers',
    description: 'Registered buyers from the production User table.',
    filters: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'active', label: 'Active (has orders)', value: 'active' },
      { id: 'inactive', label: 'Inactive', value: 'inactive' },
    ],
    columns: [
      { key: 'name', header: 'Name', render: (r) => r.name || '—' },
      { key: 'email', header: 'Email', render: (r) => r.email },
      { key: 'phone', header: 'Phone', render: (r) => r.phone || '—', secondary: true },
      { key: 'orders', header: 'Orders', render: (r) => formatCount(r.orderCount) },
      { key: 'status', header: 'Status', render: (r) => badge(r.active ? 'ACTIVE' : 'INACTIVE') },
      { key: 'created', header: 'Joined', render: (r) => date(r.createdAt), secondary: true },
    ],
  }),

  sellers: () => ({
    url: '/api/corporate/sellers',
    title: 'Sellers',
    description: 'Registered sellers with approval state and activity.',
    filters: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'approved', label: 'Approved', value: 'approved' },
      { id: 'pending', label: 'Pending', value: 'pending' },
      { id: 'rejected', label: 'Rejected', value: 'rejected' },
      { id: 'suspended', label: 'Suspended', value: 'suspended' },
      { id: 'blocked', label: 'Blocked', value: 'blocked' },
    ],
    columns: [
      { key: 'store', header: 'Store', render: (r) => r.storeName || '—' },
      { key: 'owner', header: 'Owner', render: (r) => r.user?.fullName || r.user?.email || '—' },
      { key: 'status', header: 'Status', render: (r) => badge(r.status) },
      { key: 'products', header: 'Products', render: (r) => formatCount(r._count?.products ?? 0) },
      { key: 'orders', header: 'Orders', render: (r) => formatCount(r._count?.orders ?? 0) },
      { key: 'city', header: 'City', render: (r) => r.city || '—', secondary: true },
      { key: 'created', header: 'Registered', render: (r) => date(r.createdAt), secondary: true },
    ],
  }),

  products: () => ({
    url: '/api/corporate/products',
    title: 'Products',
    description: 'Catalogue with stock and approval state.',
    filters: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'approved', label: 'Approved', value: 'approved' },
      { id: 'pending', label: 'Pending', value: 'pending' },
      { id: 'draft', label: 'Draft', value: 'draft' },
      { id: 'rejected', label: 'Rejected', value: 'rejected' },
      { id: 'blocked', label: 'Blocked', value: 'blocked' },
      { id: 'oos', label: 'Out of stock', value: 'outofstock' },
    ],
    columns: [
      { key: 'title', header: 'Product', render: (r) => r.title || '—' },
      { key: 'seller', header: 'Seller', render: (r) => r.seller?.storeName || '—' },
      { key: 'category', header: 'Category', render: (r) => r.category || '—', secondary: true },
      { key: 'price', header: 'Price', render: (r) => formatCurrency(r.price) },
      { key: 'stock', header: 'Stock', render: (r) => formatCount(r.stock) },
      { key: 'status', header: 'Status', render: (r) => badge(r.status) },
    ],
  }),

  orders: () => ({
    url: '/api/corporate/orders',
    title: 'Orders',
    description: 'Order records with payment and fulfilment state.',
    filters: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'pending', label: 'Pending', value: 'pending' },
      { id: 'completed', label: 'Completed', value: 'completed' },
      { id: 'cancelled', label: 'Cancelled', value: 'cancelled' },
      { id: 'refunded', label: 'Refunded', value: 'refunded' },
    ],
    columns: [
      { key: 'num', header: 'Order', render: (r) => r.orderNumber || r.id },
      { key: 'buyer', header: 'Customer', render: (r) => r.buyer?.fullName || r.buyer?.email || '—' },
      { key: 'seller', header: 'Seller', render: (r) => r.seller?.storeName || '—', secondary: true },
      {
        key: 'items',
        header: 'Items',
        render: (r) =>
          (r.items || []).length
            ? (r.items || []).map((i: any) => `${i.quantity}× ${i.title}`).join(', ')
            : '—',
        secondary: true,
      },
      { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.totalAmount) },
      { key: 'method', header: 'Method', render: (r) => badge(r.isCod ? 'COD' : r.paymentMethod || 'ONLINE') },
      { key: 'pay', header: 'Payment', render: (r) => badge(r.paymentStatus) },
      { key: 'status', header: 'Status', render: (r) => badge(r.status) },
      { key: 'date', header: 'Date', render: (r) => date(r.createdAt), secondary: true },
    ],
  }),

  payments: () => ({
    url: '/api/corporate/finance?view=payments',
    title: 'Payments',
    description: 'Payment records. COD is expected collection, shown separately from online payments.',
    filters: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'online', label: 'Online', value: 'online' },
      { id: 'cod', label: 'COD', value: 'cod' },
      { id: 'paid', label: 'Paid', value: 'paid' },
      { id: 'failed', label: 'Failed', value: 'failed' },
      { id: 'refunded', label: 'Refunded', value: 'refunded' },
    ],
    columns: [
      { key: 'order', header: 'Order', render: (r) => r.order?.orderNumber || r.orderId || '—' },
      { key: 'gateway', header: 'Gateway', render: (r) => badge(r.gateway) },
      { key: 'method', header: 'Method', render: (r) => (r.order?.isCod ? 'COD' : r.method || '—') },
      { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
      { key: 'status', header: 'Status', render: (r) => badge(r.status) },
      { key: 'date', header: 'Date', render: (r) => date(r.createdAt), secondary: true },
    ],
  }),

  commission: () => ({
    url: '/api/corporate/finance?view=commission',
    title: 'Commission',
    description: 'Commission earned per order, from the Commission table.',
    filters: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'pending', label: 'Pending', value: 'pending' },
      { id: 'processed', label: 'Processed', value: 'processed' },
      { id: 'cancelled', label: 'Cancelled', value: 'cancelled' },
    ],
    columns: [
      { key: 'order', header: 'Order', render: (r) => r.orderId },
      { key: 'seller', header: 'Seller', render: (r) => r.seller?.storeName || '—' },
      { key: 'amount', header: 'Order value', render: (r) => formatCurrency(r.orderAmount) },
      { key: 'rate', header: 'Rate', render: (r) => `${r.commissionRate}%` },
      { key: 'commission', header: 'Commission', render: (r) => formatCurrency(r.commissionAmount) },
      { key: 'payout', header: 'Seller payout', render: (r) => formatCurrency(r.sellerPayout) },
      { key: 'status', header: 'Status', render: (r) => badge(r.status) },
    ],
  }),

  settlements: () => ({
    url: '/api/corporate/finance?view=settlements',
    title: 'Seller Settlements',
    description: 'Payouts to sellers, from the SellerSettlement table.',
    filters: [
      { id: 'all', label: 'All', value: 'all' },
      { id: 'pending', label: 'Pending', value: 'pending' },
      { id: 'processing', label: 'Processing', value: 'processing' },
      { id: 'transferred', label: 'Transferred', value: 'transferred' },
      { id: 'failed', label: 'Failed', value: 'failed' },
    ],
    columns: [
      { key: 'seller', header: 'Seller', render: (r) => r.seller?.storeName || '—' },
      { key: 'order', header: 'Order', render: (r) => r.orderId },
      { key: 'gross', header: 'Gross', render: (r) => formatCurrency(r.grossAmount) },
      { key: 'commission', header: 'Commission', render: (r) => formatCurrency(r.commissionAmount) },
      { key: 'amount', header: 'Seller amount', render: (r) => formatCurrency(r.sellerAmount) },
      { key: 'status', header: 'Status', render: (r) => badge(r.status) },
    ],
  }),
};