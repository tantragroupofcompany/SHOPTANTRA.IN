import React, { useState } from 'react';
import {
  TrendingUp,
  Users,
  DollarSign,
  ActivitySquare,
  BarChart3,
  TrendingDown,
  Download,
  Activity,
  Clock,
  AlertCircle,
  Globe,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { StatCard } from '../../components/ui/Card';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const Analytics = () => {
  const [timeframe] = useState('6m');

  // Sample data
  const kpis = {
    totalUsers: 5234,
    newUsersThisMonth: 342,
    totalRevenue: 185420,
    ordersGrowth: 12.5,
  };

  const userGrowthData = [
    { month: 'Jan', value: 3200, percentage: 100 },
    { month: 'Feb', value: 3600, percentage: 112 },
    { month: 'Mar', value: 4100, percentage: 128 },
    { month: 'Apr', value: 4200, percentage: 131 },
    { month: 'May', value: 4800, percentage: 150 },
    { month: 'Jun', value: 5234, percentage: 163 },
  ];

  const revenueData = [
    { month: 'Jan', value: 24000 },
    { month: 'Feb', value: 28000 },
    { month: 'Mar', value: 32000 },
    { month: 'Apr', value: 35000 },
    { month: 'May', value: 42000 },
    { month: 'Jun', value: 51420 },
  ];

  const maxRevenue = Math.max(...revenueData.map(d => d.value));

  const leadAnalytics = {
    totalLeads: 1243,
    converted: 287,
    conversionRate: 23.1,
    bySources: [
      { source: 'Website', count: 645, converted: 158 },
      { source: 'Referral', count: 342, converted: 89 },
      { source: 'Social', count: 256, converted: 40 },
    ],
  };

  const growthMetrics = {
    momGrowth: 8.5,
    yoyComparison: 45.2,
  };

  const platformHealth = {
    uptime: 99.98,
    avgResponseTime: 145,
    errorRate: 0.02,
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const data = [
      ['Total Users', kpis.totalUsers],
      ['New Users (This Month)', kpis.newUsersThisMonth],
      ['Total Revenue', `$${kpis.totalRevenue}`],
      ['Orders Growth %', `${kpis.ordersGrowth}%`],
      ['Total Leads', leadAnalytics.totalLeads],
      ['Converted Leads', leadAnalytics.converted],
      ['Conversion Rate', `${leadAnalytics.conversionRate}%`],
      ['Platform Uptime', `${platformHealth.uptime}%`],
      ['Avg Response Time', `${platformHealth.avgResponseTime}ms`],
      ['Error Rate', `${platformHealth.errorRate}%`],
    ];

    const csv = [headers, ...data].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={exportToCSV}>
          Export CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={kpis.totalUsers.toLocaleString()}
          change="+12.5% from last month"
          changeType="positive"
          icon={<Users className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="New Users (This Month)"
          value={kpis.newUsersThisMonth}
          change="↑ 24% vs last month"
          changeType="positive"
          icon={<UserCheck className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Total Revenue"
          value={`$${kpis.totalRevenue.toLocaleString()}`}
          change="+18.2% from last month"
          changeType="positive"
          icon={<DollarSign className="w-5 h-5 text-orange-500" />}
        />
        <StatCard
          title="Orders Growth %"
          value={`${kpis.ordersGrowth}%`}
          change="↑ 3.1% vs last month"
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
        />
      </div>

      {/* User Growth Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">User Growth (6 Months)</h2>
        <div className="space-y-4">
          {userGrowthData.map(item => (
            <div key={item.month} className="flex items-center gap-4">
              <span className="w-12 text-sm font-medium text-gray-600">{item.month}</span>
              <div className="flex-1">
                <div className="bg-gray-100 rounded-full overflow-hidden h-8">
                  <div
                    className="bg-orange-500 h-full rounded-full flex items-center justify-end pr-3 transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  >
                    <span className="text-xs font-semibold text-white">{item.value.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Revenue Analytics Chart */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Revenue Analytics (6 Months)</h2>
        <div className="flex items-end justify-center gap-2 h-48">
          {revenueData.map((item, idx) => {
            const height = (item.value / maxRevenue) * 100;
            return (
              <div key={item.month} className="flex flex-col items-center gap-2 flex-1">
                <div className="relative h-40 w-full flex items-end justify-center">
                  <div
                    className="bg-gradient-to-t from-orange-500 to-orange-400 rounded-t w-3/4 transition-all duration-300 hover:from-orange-600 hover:to-orange-500"
                    style={{ height: `${height}%` }}
                    title={`$${item.value.toLocaleString()}`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">{item.month}</span>
              </div>
            );
          })}
        </div>
        <svg viewBox="0 0 400 100" className="w-full h-20 mt-4 text-gray-300">
          <path
            d={`M 0 ${100 - (revenueData[0].value / maxRevenue) * 80} ${revenueData.map((d, i) => `L ${(i / (revenueData.length - 1)) * 400} ${100 - (d.value / maxRevenue) * 80}`).join(' ')}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.2"
          />
        </svg>
      </Card>

      {/* Lead Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <MessageSquare className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{leadAnalytics.totalLeads.toLocaleString()}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Converted</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{leadAnalytics.converted}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{leadAnalytics.conversionRate}%</p>
          </div>
        </Card>
      </div>

      {/* Leads by Source */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Leads by Source</h2>
        <div className="space-y-4">
          {leadAnalytics.bySources.map(source => (
            <div key={source.source} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{source.source}</p>
                <p className="text-sm text-gray-500">
                  {source.converted} of {source.count} leads converted
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {((source.converted / source.count) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            MoM Growth
          </h3>
          <p className="text-4xl font-bold text-gray-900">{growthMetrics.momGrowth}%</p>
          <p className="text-sm text-green-600 mt-2">↑ Month over month increase</p>
        </Card>
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            YoY Comparison
          </h3>
          <p className="text-4xl font-bold text-gray-900">{growthMetrics.yoyComparison}%</p>
          <p className="text-sm text-green-600 mt-2">↑ Year over year increase</p>
        </Card>
      </div>

      {/* Platform Health */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-orange-500" />
          Platform Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Uptime</p>
              <Badge label="Excellent" variant="success" size="sm" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{platformHealth.uptime}%</p>
            <p className="text-xs text-gray-500 mt-1">Service availability</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Avg Response Time</p>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{platformHealth.avgResponseTime}ms</p>
            <p className="text-xs text-gray-500 mt-1">Average server response</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm">Error Rate</p>
              <AlertCircle className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{platformHealth.errorRate}%</p>
            <p className="text-xs text-gray-500 mt-1">System errors</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
