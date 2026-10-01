/**
 * Shared, client-safe types and formatters for the three executive dashboards.
 *
 * The data shape mirrors the EXISTING, already-shipped `/api/corporate/dashboard`
 * contract (see src/app/api/corporate/dashboard/route.ts). These dashboards were
 * previously static placeholders that rendered an em dash and the text
 * "Connect backend APIs"; they now consume that endpoint instead of inventing a
 * second, competing metrics API.
 *
 * Nothing here contains sample or placeholder values - only the shape of a real
 * response and INR formatting.
 */

export interface ExecutiveDashboardData {
  today: {
    revenue: number;
    orders: number;
    payments: number;
    newUsers: number;
    newSellers: number;
    newBuyers: number;
  };
  company: {
    totalRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    refundOrders: number;
  };
  marketplace: {
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
    blockedProducts: number;
    rejectedProducts: number;
    outOfStockProducts: number;
    draftProducts: number;
    totalCategories: number;
    lowStockProducts: number;
    totalInventory: number;
  };
  sellers: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    suspended: number;
    blocked: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    pendingApprovalSellers: any[];
    topSellers: any[];
  };
  buyers: { total: number; newToday: number; active: number; inactive: number; topBuyers: any[] };
  customers: { total: number; newToday: number; active: number; inactive: number };
  payments: {
    totalCollected: number;
    pendingSettlement: number;
    failedPayments: number;
    refunds: number;
    razorpay: number;
    cod: number;
    other: number;
    commissionCollected: number;
    totalPayments: number;
    sellerPayable: number;
    sellerSettled: number;
    pendingSettlementTotal: number;
    failedTransferTotal: number;
  };
  finance: {
    grossSales: number;
    platformCommission: number;
    sellerPayable: number;
    sellerSettled: number;
    pendingSettlement: number;
    failedTransfers: number;
    refunds: number;
    commissionCollected: number;
  };
  shipping: {
    ready: number;
    packed: number;
    shipped: number;
    inTransit: number;
    delivered: number;
    returned: number;
    cancelled: number;
  };
  shipments: { total: number; byStatus: Record<string, number> };
  support: { open: number; resolved: number; pending: number };
  analytics: {
    topProducts: { id: string; title: string; soldCount: number; sales: number }[];
    topCategories: { name: string; productCount: number }[];
    revenueByMonth: { month: string; revenue: number; orders: number }[];
    ordersByMonth: { month: string; orders: number }[];
  };
  business: {
    totalBranches: number;
    totalEmployees: number;
    totalAdvertisements: number;
    totalCoupons: number;
    totalReviews: number;
  };
  security: {
    failedLogins: number;
    blockedAccounts: number;
    corporateSessions: number;
    recentLogins: number;
    jwtStatus: string;
  };
  pendingApprovals: { sellers: number; products: number; total: number };
  recentOrders: any[];
  recentSellers: any[];
  recentProducts: any[];
  totalUsers: number;
}

/** INR display, matching the existing CorporateDashboard formatter. */
export function formatCurrency(value: number): string {
  const num = Number(value || 0);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

/** Plain integer for counts. A real zero renders as "0", never as a dash. */
export function formatCount(value: number): string {
  return Number(value || 0).toLocaleString('en-IN');
}

/** Metric value for a section that genuinely has no rows yet. */
export function formatEmptyState(value: number, noun: string): string {
  return Number(value || 0) === 0 ? 'No data yet' : formatCount(value);
}