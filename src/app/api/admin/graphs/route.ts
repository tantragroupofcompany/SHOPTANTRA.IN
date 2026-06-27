import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const now = new Date();

    // 1. Daily Sales & Commission (Last 30 Days)
    const dailySales: Record<string, { date: string; sales: number; orders: number; commission: number }> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailySales[dateStr] = { date: dateStr, sales: 0, orders: 0, commission: 0 };
    }

    const startOf30DaysAgo = new Date(now);
    startOf30DaysAgo.setDate(startOf30DaysAgo.getDate() - 30);
    startOf30DaysAgo.setHours(0, 0, 0, 0);

    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOf30DaysAgo },
        paymentStatus: { in: ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'] },
      },
      include: { commission: true },
    });

    recentOrders.forEach(order => {
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (dailySales[dateStr]) {
        dailySales[dateStr].sales += order.totalAmount;
        dailySales[dateStr].orders += 1;
        if (order.commission) {
          dailySales[dateStr].commission += order.commission.commissionAmount;
        }
      }
    });

    const dailyChartData = Object.values(dailySales);

    // 2. Monthly Sales & Commission (Last 12 Months)
    const monthlySales: Record<string, { month: string; sales: number; orders: number; commission: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlySales[monthStr] = { month: monthStr, sales: 0, orders: 0, commission: 0 };
    }

    const startOf12MonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const yearlyOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOf12MonthsAgo },
        paymentStatus: { in: ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'] },
      },
      include: { commission: true },
    });

    yearlyOrders.forEach(order => {
      const monthStr = order.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlySales[monthStr]) {
        monthlySales[monthStr].sales += order.totalAmount;
        monthlySales[monthStr].orders += 1;
        if (order.commission) {
          monthlySales[monthStr].commission += order.commission.commissionAmount;
        }
      }
    });

    const monthlyChartData = Object.values(monthlySales);

    // 3. Seller & Buyer Cumulative Growth (Last 12 Months)
    const sellerGrowth: Record<string, number> = {};
    const buyerGrowth: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      sellerGrowth[monthStr] = 0;
      buyerGrowth[monthStr] = 0;
    }

    const sellers = await prisma.seller.findMany({
      where: { createdAt: { gte: startOf12MonthsAgo } },
      select: { createdAt: true },
    });
    sellers.forEach(s => {
      const monthStr = s.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (sellerGrowth[monthStr] !== undefined) {
        sellerGrowth[monthStr]++;
      }
    });

    const buyers = await prisma.user.findMany({
      where: { role: 'BUYER', createdAt: { gte: startOf12MonthsAgo } },
      select: { createdAt: true },
    });
    buyers.forEach(b => {
      const monthStr = b.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (buyerGrowth[monthStr] !== undefined) {
        buyerGrowth[monthStr]++;
      }
    });

    let runningSellers = await prisma.seller.count({ where: { createdAt: { lt: startOf12MonthsAgo } } });
    const sellerGrowthData = Object.keys(sellerGrowth).map(m => {
      runningSellers += sellerGrowth[m];
      return { month: m, count: runningSellers };
    });

    let runningBuyers = await prisma.user.count({ where: { role: 'BUYER', createdAt: { lt: startOf12MonthsAgo } } });
    const buyerGrowthData = Object.keys(buyerGrowth).map(m => {
      runningBuyers += buyerGrowth[m];
      return { month: m, count: runningBuyers };
    });

    // 4. Categorical & Geographical Sales Distributions
    const categoriesMap: Record<string, number> = {};
    const productsMap: Record<string, { name: string; sales: number; units: number }> = {};
    const statesMap: Record<string, number> = {};
    const citiesMap: Record<string, number> = {};

    const allCompletedOrders = await prisma.order.findMany({
      where: { paymentStatus: { in: ['PAID', 'COD_PENDING', 'UPI_VERIFICATION_PENDING'] } },
      include: { items: { include: { product: true } } },
    });

    allCompletedOrders.forEach(order => {
      let shipping: any = {};
      try {
        shipping = typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : (order.shippingAddress || {});
      } catch (e) {}

      const state = shipping.state || 'N/A';
      const city = shipping.city || 'N/A';

      statesMap[state] = (statesMap[state] || 0) + order.totalAmount;
      citiesMap[city] = (citiesMap[city] || 0) + order.totalAmount;

      order.items.forEach(item => {
        const cat = item.product?.category || 'General';
        categoriesMap[cat] = (categoriesMap[cat] || 0) + item.total;

        if (!productsMap[item.title]) {
          productsMap[item.title] = { name: item.title, sales: 0, units: 0 };
        }
        productsMap[item.title].sales += item.total;
        productsMap[item.title].units += item.quantity;
      });
    });

    const topCategories = Object.keys(categoriesMap)
      .map(k => ({ name: k, value: Math.round(categoriesMap[k]) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topProducts = Object.values(productsMap)
      .sort((a: any, b: any) => b.sales - a.sales)
      .slice(0, 5);

    const topStates = Object.keys(statesMap)
      .map(k => ({ name: k, sales: Math.round(statesMap[k]) }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const topCities = Object.keys(citiesMap)
      .map(k => ({ name: k, sales: Math.round(citiesMap[k]) }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        dailyChartData,
        monthlyChartData,
        sellerGrowthData,
        buyerGrowthData,
        topCategories,
        topProducts,
        topStates,
        topCities,
      },
    });
  } catch (error: any) {
    console.error('Error generating platform graph data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate graph data' },
      { status: 500 }
    );
  }
}
