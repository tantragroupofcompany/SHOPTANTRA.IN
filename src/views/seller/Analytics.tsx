import { useState, useEffect } from 'react';
import { Users, TrendingUp, BarChart3, Star, MapPin } from 'lucide-react';
import { Card, StatCard } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';

interface TrafficStats {
  // ShopTantra does not currently record page-view or bounce telemetry, so these
  // are reported as "not tracked" rather than being invented from order counts.
  pageViewsTracked: boolean;
  uniqueVisitorsTracked: boolean;
  bounceRateTracked: boolean;
  // Derived purely from real database rows.
  totalOrders: number;
  totalCustomers: number;
  conversionRate: number | null;
}

interface TopProduct {
  title: string;
  unitsSold: number;
}

interface DemographicData {
  location: string;
  customers: number;
}

interface ReviewTrend {
  month: string;
  avgRating: number;
}

const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TrafficStats>({
    pageViewsTracked: false,
    uniqueVisitorsTracked: false,
    bounceRateTracked: false,
    totalOrders: 0,
    totalCustomers: 0,
    conversionRate: null,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<{ label: string; value: number }[]>([]);
  const [demographics, setDemographics] = useState<DemographicData[]>([]);
  const [reviewTrends, setReviewTrends] = useState<ReviewTrend[]>([]);
  const [overallRating, setOverallRating] = useState<number | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      if (!user?.id) return;

      // 1. Fetch general analytics (revenue metrics, top products, customer counts)
      const genRes = await fetch(`/api/analytics?sellerId=${user.id}`);
      if (genRes.ok) {
        const genData = await genRes.json();
        if (genData.success && genData.data) {
          const data = genData.data;

          // Top products: real units sold, straight from the API. This view used
          // to report `views = units * 10 + 20`, which presented a fabricated
          // impression number to sellers as if it were measured traffic.
          const topProds = (data.topProducts || []).map((p: any) => ({
            title: p.name,
            unitsSold: p.units,
          }));
          setTopProducts(topProds);

          const totalOrders = data.revenue?.totalOrders || 0;
          const totalCustomers = data.totalCustomers || 0;

          // Real 7-day revenue series for the trend chart.
          const series = Array.isArray(data.revenueSeries) ? data.revenueSeries : [];
          setRevenueByDay(
            series.map((d: any) => ({ label: d.label, value: Number(d.value) || 0 }))
          );

          setStats({
            pageViewsTracked: false,
            uniqueVisitorsTracked: false,
            bounceRateTracked: false,
            totalOrders,
            totalCustomers,
            // Orders-per-customer. Meaningful only once there is real traffic;
            // below 5 customers the number is noise, so it is shown as null.
            conversionRate:
              totalCustomers >= 5 && totalOrders > 0
                ? parseFloat(((totalOrders / totalCustomers) * 100).toFixed(2))
                : null,
          });
        }
      }

      // 2. Fetch reviews for rating and review trends
      const revRes = await fetch(`/api/seller/reviews?userId=${user.id}`);
      if (revRes.ok) {
        const revData = await revRes.json();
        if (revData.success && revData.data) {
          const reviews = revData.data;
          if (reviews.length > 0) {
            const avgRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;
            setOverallRating(Math.round(avgRating * 10) / 10);
          }

          // review trends by month
          const monthMap = new Map<string, { total: number; count: number }>();
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

          reviews.forEach((review: any) => {
            const date = new Date(review.created_at);
            const monthName = months[date.getMonth()] || 'Unknown';
            const existing = monthMap.get(monthName) || { total: 0, count: 0 };
            monthMap.set(monthName, {
              total: existing.total + review.rating,
              count: existing.count + 1,
            });
          });

          const trends = months.slice(0, 6).map(month => {
            const data = monthMap.get(month);
            return {
              month,
              avgRating: data ? Math.round((data.total / data.count) * 10) / 10 : 0,
            };
          });
          setReviewTrends(trends);
        }
      }

      // 3. Fetch orders for customer demographics
      const ordRes = await fetch(`/api/seller/orders?userId=${user.id}`);
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        if (ordData.success && ordData.data) {
          const orders = ordData.data;
          const locMap = new Map<string, number>();
          orders.forEach((order: any) => {
            if (order.shipping_address) {
              const city = order.shipping_address.city || 'Unknown';
              const state = order.shipping_address.state || 'Unknown';
              const location = `${city}, ${state}`;
              locMap.set(location, (locMap.get(location) || 0) + 1);
            }
          });

          const demogData = Array.from(locMap.entries())
            .map(([location, count]) => ({
              location,
              customers: count,
            }))
            .sort((a, b) => b.customers - a.customers)
            .slice(0, 5);

          setDemographics(demogData);

          // Real 7-day revenue series, grouped from stored orders. Only
          // cancelled orders are excluded; un-delivered COD orders are counted
          // because they are genuine sales. `total` is the order total stored on
          // the row, never a recomputed or estimated figure.
          const dayBuckets = new Map<string, { value: number; orders: number }>();
          const DAY_MS = 24 * 60 * 60 * 1000;
          const now = Date.now();
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now - i * DAY_MS);
            dayBuckets.set(d.toISOString().slice(0, 10), { value: 0, orders: 0 });
          }
          for (const order of orders as any[]) {
            if (String(order.status || '').toUpperCase() === 'CANCELLED') continue;
            const key = new Date(order.created_at || order.createdAt || now)
              .toISOString()
              .slice(0, 10);
            const bucket = dayBuckets.get(key);
            if (!bucket) continue;
            const amount = Number(order.total ?? order.totalAmount ?? 0);
            if (Number.isFinite(amount)) bucket.value += amount;
            bucket.orders += 1;
          }
          setRevenueByDay(
            Array.from(dayBuckets.entries()).map(([date, v]) => ({
              label: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
              value: Math.round(v.value),
              orders: v.orders,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Revenue trend straight from stored orders.
  // The old version plotted the hardcoded array [2400, 3200, 2800, 3600, 4100,
  // 3800] and captioned it "positive growth over the past 6 months" for every
  // seller, including sellers with zero sales. It now renders the real daily
  // revenue and says so when there is none.
  const drawRevenueChart = () => {
    const width = 280;
    const height = 150;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    if (revenueByDay.length === 0 || revenueByDay.every((d) => d.value === 0)) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-10">
          <p className="text-sm text-gray-600">No revenue recorded in the last 7 days</p>
          <p className="text-xs text-gray-400 mt-1">
            The revenue trend is built from stored orders only — nothing is estimated.
          </p>
        </div>
      );
    }

    const maxValue = Math.max(...revenueByDay.map((d) => d.value), 1);
    const points = revenueByDay.map((point, index) => {
      const x =
        revenueByDay.length === 1
          ? padding + chartWidth / 2
          : padding + (index / (revenueByDay.length - 1)) * chartWidth;
      const y = padding + chartHeight - (point.value / maxValue) * chartHeight;
      return `${x},${y}`;
    });

    const pathData = `M${points.join(' L')}`;

    return (
      <div className="w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L${points[points.length - 1].split(',')[0]},${height - padding} L${padding},${height - padding} Z`}
            fill="url(#areaGradient)"
          />
          <path d={pathData} stroke="#ea580c" strokeWidth="2" fill="none" />
          {points.map((point, i) => (
            <circle
              key={i}
              cx={point.split(',')[0]}
              cy={point.split(',')[1]}
              r="4"
              fill="#ea580c"
            />
          ))}
        </svg>
        <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
          <span>{revenueByDay[0]?.label}</span>
          <span>{revenueByDay[revenueByDay.length - 1]?.label}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Track your store performance and customer insights</p>
      </div>

      {/* Sales stats.
          Page views / unique visitors / bounce rate are deliberately NOT shown:
          this platform records no traffic telemetry, and these cards used to
          render invented values (totalOrders * 12 + 100 page views, a fixed
          35.5% bounce rate) as if they were measured. Only real figures
          aggregated from the database are displayed. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Orders"
          value={(stats.totalOrders || 0).toLocaleString()}
          icon={TrendingUp}
          color="navy"
        />
        <StatCard
          title="Unique Customers"
          value={(stats.totalCustomers || 0).toLocaleString()}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Orders per Customer"
          value={
            stats.conversionRate === null ? 'Not enough data' : `${stats.conversionRate}%`
          }
          icon={BarChart3}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend (7-Day)</h2>
          <div className="flex justify-center">
            {drawRevenueChart()}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Sum of stored order totals per day, last 7 days
              {stats.totalOrders ? ` · ${stats.totalOrders} order(s) all-time` : ''}
            </p>
          </div>
        </Card>

        {/* Overall Rating */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="text-yellow-500" size={20} />
            Overall Rating
          </h2>
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-500 mb-2">{overallRating}</div>
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={i < Math.floor(overallRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            <p className="text-sm text-gray-600">Based on customer reviews</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Products */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No product data available</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => {
                const maxUnits = Math.max(...topProducts.map((p) => p.unitsSold || 0), 1);
                return (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="font-medium text-gray-900">{product.title}</p>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <span>{product.unitsSold} units sold</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1 bg-gray-200 rounded h-2">
                      <div
                        className="bg-orange-500 h-2 rounded"
                        style={{ width: `${Math.min(100, ((product.unitsSold || 0) / maxUnits) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Customer Demographics */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Customer Locations
          </h2>
          {demographics.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No customer location data</p>
          ) : (
            <div className="space-y-3">
              {demographics.map((location, index) => (
                <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                  <p className="font-medium text-gray-900 text-sm">{location.location}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-600">{location.customers} customers</span>
                    <div className="bg-gray-200 rounded h-2 flex-1 ml-2">
                      <div
                        className="bg-blue-500 h-2 rounded"
                        style={{ width: `${(location.customers / 50) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Review Score Trends */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Score Trends (6 Months)</h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {reviewTrends.map((trend, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-700 mb-2">{trend.month}</p>
              <p className="text-2xl font-bold text-orange-500">
                {trend.avgRating > 0 ? trend.avgRating.toFixed(1) : '-'}
              </p>
              {trend.avgRating > 0 && (
                <div className="flex justify-center gap-0.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i < Math.floor(trend.avgRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default function SafeAnalytics() {
  return (
    <ErrorBoundary>
      <Analytics />
    </ErrorBoundary>
  );
}
