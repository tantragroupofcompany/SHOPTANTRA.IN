module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[project]/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
;
;
const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
// Dynamically resolve absolute path to SQLite file at runtime for Vercel lambdas
let dbUrl = process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith('file:')) {
    const relativePath = dbUrl.substring(5); // remove 'file:'
    if (!__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].isAbsolute(relativePath)) {
        let absolutePath;
        if (relativePath.startsWith('prisma/') || relativePath.startsWith('./prisma/')) {
            absolutePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(process.cwd(), relativePath);
        } else {
            absolutePath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].resolve(process.cwd(), 'prisma', relativePath);
        }
        dbUrl = `file:${absolutePath}`;
    }
}
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    datasources: dbUrl ? {
        db: {
            url: dbUrl
        }
    } : undefined,
    log: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : [
        'warn'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/src/app/api/admin/reports/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'revenue';
        const fromStr = searchParams.get('from');
        const toStr = searchParams.get('to');
        const fromDate = fromStr ? new Date(fromStr) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = toStr ? new Date(toStr) : new Date();
        toDate.setHours(23, 59, 59, 999);
        // Fetch all orders within range
        const orders = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].order.findMany({
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate
                }
            },
            include: {
                buyer: true,
                seller: true,
                commission: true,
                items: true,
                shipments: {
                    include: {
                        courierPartner: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        if (type === 'revenue') {
            // Group by daily date
            const dailyMap = {};
            orders.forEach((order)=>{
                const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
                if (!dailyMap[dateKey]) {
                    dailyMap[dateKey] = {
                        date: dateKey,
                        revenue: 0,
                        ordersCount: 0,
                        commissionEarned: 0,
                        avgOrderValue: 0
                    };
                }
                // Count paid/pending verification orders in revenue
                const isValid = [
                    'PAID',
                    'COD_PENDING',
                    'UPI_VERIFICATION_PENDING'
                ].includes(order.paymentStatus);
                if (isValid) {
                    dailyMap[dateKey].revenue += order.totalAmount;
                    dailyMap[dateKey].ordersCount += 1;
                    if (order.commission) {
                        dailyMap[dateKey].commissionEarned += order.commission.commissionAmount;
                    }
                }
            });
            const reportData = Object.values(dailyMap).map((row)=>{
                row.avgOrderValue = row.ordersCount > 0 ? Math.round(row.revenue / row.ordersCount) : 0;
                row.commissionEarned = Math.round(row.commissionEarned);
                return row;
            }).sort((a, b)=>b.date.localeCompare(a.date));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: reportData
            });
        }
        if (type === 'sellers') {
            const dailyMap = {};
            orders.forEach((order)=>{
                const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
                if (!dailyMap[dateKey]) {
                    dailyMap[dateKey] = {
                        date: dateKey,
                        sellersCount: 0,
                        revenue: 0,
                        commissionEarned: 0,
                        sellersSet: new Set()
                    };
                }
                const isValid = [
                    'PAID',
                    'COD_PENDING',
                    'UPI_VERIFICATION_PENDING'
                ].includes(order.paymentStatus);
                if (isValid && order.sellerId) {
                    dailyMap[dateKey].revenue += order.totalAmount;
                    dailyMap[dateKey].sellersSet.add(order.sellerId);
                    if (order.commission) {
                        dailyMap[dateKey].commissionEarned += order.commission.commissionAmount;
                    }
                }
            });
            const reportData = Object.values(dailyMap).map((row)=>{
                row.sellersCount = row.sellersSet.size;
                row.commissionEarned = Math.round(row.commissionEarned);
                delete row.sellersSet;
                return row;
            }).sort((a, b)=>b.date.localeCompare(a.date));
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: reportData
            });
        }
        if (type === 'customers') {
            const customerMap = {};
            orders.forEach((order)=>{
                const buyerId = order.buyerId;
                if (!buyerId) return;
                if (!customerMap[buyerId]) {
                    customerMap[buyerId] = {
                        id: buyerId,
                        name: order.buyer?.fullName || 'N/A',
                        email: order.buyer?.email || 'N/A',
                        phone: order.buyer?.phone || 'N/A',
                        ordersCount: 0,
                        totalSpent: 0
                    };
                }
                const isValid = [
                    'PAID',
                    'COD_PENDING',
                    'UPI_VERIFICATION_PENDING'
                ].includes(order.paymentStatus);
                if (isValid) {
                    customerMap[buyerId].ordersCount += 1;
                    customerMap[buyerId].totalSpent += order.totalAmount;
                }
            });
            const reportData = Object.values(customerMap).sort((a, b)=>b.totalSpent - a.totalSpent);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: reportData
            });
        }
        if (type === 'orders') {
            const reportData = orders.map((order)=>{
                const shipment = order.shipments[0];
                return {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    date: new Date(order.createdAt).toISOString().split('T')[0],
                    customerName: order.buyer?.fullName || 'N/A',
                    customerEmail: order.buyer?.email || 'N/A',
                    customerMobile: order.buyer?.phone || 'N/A',
                    sellerName: order.seller?.storeName || 'N/A',
                    itemsCount: order.items.length,
                    totalAmount: order.totalAmount,
                    commissionAmount: order.commission?.commissionAmount || Math.round(order.totalAmount * 0.10),
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                    paymentMethod: order.paymentMethod || 'COD',
                    trackingNumber: shipment?.trackingNumber || order.shipments.find((s)=>s.trackingNumber)?.trackingNumber || 'N/A',
                    carrier: shipment?.courierPartner?.name || 'Manual Speed Post'
                };
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: reportData
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Invalid report type'
        }, {
            status: 400
        });
    } catch (error) {
        console.error('Error generating reports:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Failed to generate reports'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1o20niz._.js.map