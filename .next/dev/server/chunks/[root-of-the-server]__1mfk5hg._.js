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
"[project]/src/app/api/supabase-polyfill/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
;
;
// Define categories list for static mapping
const STATIC_CATEGORIES = [
    {
        id: 'cat-1',
        name: 'Electronics'
    },
    {
        id: 'cat-2',
        name: 'Fashion'
    },
    {
        id: 'cat-3',
        name: 'Home & Kitchen'
    },
    {
        id: 'cat-4',
        name: 'Beauty'
    },
    {
        id: 'cat-5',
        name: 'Grocery'
    },
    {
        id: 'cat-6',
        name: 'Books'
    },
    {
        id: 'cat-7',
        name: 'Toys'
    },
    {
        id: 'cat-8',
        name: 'Sports'
    },
    {
        id: 'cat-9',
        name: 'Automotive'
    },
    {
        id: 'cat-10',
        name: 'Mobile Accessories'
    },
    {
        id: 'cat-11',
        name: 'Furniture'
    },
    {
        id: 'cat-12',
        name: 'Health'
    }
];
// Helper to convert snake_case object keys to camelCase keys for Prisma updates
function toCamelCaseKeys(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(toCamelCaseKeys);
    const result = {};
    for (const key of Object.keys(obj)){
        const camelKey = key.replace(/_([a-z])/g, (g)=>g[1].toUpperCase());
        result[camelKey] = obj[key];
    }
    return result;
}
// Auto-seed function to make the local environment immediately functional
async function ensureSeeded() {
    const planCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].subscriptionPlan.count();
    if (planCount > 0) return;
    console.log('[AUTO-SEEDING]: Database is empty. Seeding subscription plans...');
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
        await tx.subscriptionPlan.create({
            data: {
                name: 'Swadeshi Basic',
                description: 'List up to 50 products with standard platform fees.',
                price: 999.0,
                features: JSON.stringify([
                    'List 50 products',
                    'Standard reports',
                    'Standard payouts'
                ]),
                durationDays: 30
            }
        });
    });
}
async function POST(request) {
    try {
        // Run auto-seed check
        await ensureSeeded();
        const body = await request.json();
        const { table, action, selectColumns, insertData, updateData, filters = [], orderColumn, orderAscending = true, limitCount, isSingle, isMaybeSingle, userId } = body;
        // Handle authentication updates specifically
        if (table === 'profiles_auth' && action === 'update_auth') {
            const updatePayload = {};
            if (updateData.password) {
                updatePayload.password = updateData.password;
            }
            if (updateData.email) {
                updatePayload.email = updateData.email;
            }
            if (updateData.full_name) {
                updatePayload.fullName = updateData.full_name;
            }
            const updatedUser = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user.update({
                where: {
                    id: userId
                },
                data: updatePayload
            });
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                user: {
                    id: updatedUser.id,
                    email: updatedUser.email,
                    role: updatedUser.role.toLowerCase(),
                    fullName: updatedUser.fullName,
                    phone: updatedUser.phone
                }
            });
        }
        // 1. Table Mappings
        if (table === 'product_categories') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: true,
                data: STATIC_CATEGORIES
            });
        }
        // Determine Prisma delegate
        let delegate = null;
        let tableMapping = {};
        switch(table){
            case 'profiles':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].user;
                tableMapping = {
                    user_id: 'id',
                    id: 'id',
                    full_name: 'fullName',
                    phone: 'phone'
                };
                break;
            case 'sellers':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].seller;
                tableMapping = {
                    user_id: 'userId',
                    id: 'id'
                };
                break;
            case 'products':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].product;
                tableMapping = {
                    seller_id: 'sellerId',
                    id: 'id'
                };
                break;
            case 'orders':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].order;
                tableMapping = {
                    seller_id: 'sellerId',
                    id: 'id'
                };
                break;
            case 'reviews':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].review;
                tableMapping = {
                    id: 'id',
                    product_id: 'productId',
                    user_id: 'userId'
                };
                break;
            case 'leads':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].lead;
                tableMapping = {
                    id: 'id'
                };
                break;
            case 'subscriptions':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].subscription;
                tableMapping = {
                    id: 'id',
                    seller_id: 'sellerId'
                };
                break;
            case 'subscription_plans':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].subscriptionPlan;
                tableMapping = {
                    id: 'id'
                };
                break;
            case 'support_tickets':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].supportTicket;
                tableMapping = {
                    id: 'id',
                    user_id: 'userId'
                };
                break;
            case 'newsletter_subscriptions':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].newsletterSubscription;
                tableMapping = {
                    id: 'id',
                    email: 'email'
                };
                break;
            case 'contact_inquiries':
                delegate = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].contactInquiry;
                tableMapping = {
                    id: 'id'
                };
                break;
            default:
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `Supabase table '${table}' is not supported by the polyfill.`
                }, {
                    status: 400
                });
        }
        // 2. Build Where Clauses
        const where = {};
        for (const filter of filters){
            let col = filter.column;
            if (tableMapping[col]) {
                col = tableMapping[col];
            }
            if (col.includes('.')) {
                const parts = col.split('.');
                if (parts[0] === 'products' && parts[1] === 'seller_id') {
                    let sellerVal = filter.value;
                    const associatedSeller = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].seller.findFirst({
                        where: {
                            userId: sellerVal
                        }
                    });
                    if (associatedSeller) {
                        sellerVal = associatedSeller.id;
                    }
                    where.product = {
                        sellerId: sellerVal
                    };
                    continue;
                }
            }
            let filterVal = filter.value;
            if (col === 'sellerId') {
                const associatedSeller = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].seller.findFirst({
                    where: {
                        userId: filterVal
                    }
                });
                if (associatedSeller) {
                    filterVal = associatedSeller.id;
                }
            }
            if (filter.operator === 'eq') {
                where[col] = filterVal;
            } else if (filter.operator === 'neq') {
                where[col] = {
                    not: filterVal
                };
            } else if (filter.operator === 'in') {
                where[col] = {
                    in: filterVal
                };
            } else if (filter.operator === 'like') {
                const val = String(filterVal).replace(/%/g, '');
                where[col] = {
                    contains: val
                };
            }
        }
        // 3. Execute CRUD Operations
        let result = null;
        if (action === 'select') {
            const options = {
                where
            };
            // Handle relations and joins requested by select query string
            if (table === 'sellers') {
                options.include = {
                    pickupAddress: true
                };
            } else if (table === 'reviews') {
                options.include = {
                    product: true,
                    user: true
                };
            } else if (table === 'subscriptions') {
                options.include = {
                    seller: true
                };
            } else if (table === 'orders') {
                options.include = {
                    buyer: true,
                    seller: true,
                    items: {
                        include: {
                            product: true
                        }
                    },
                    shipments: {
                        include: {
                            courierPartner: true
                        }
                    }
                };
            }
            // Ordering
            if (orderColumn) {
                let orderKey = orderColumn;
                if (tableMapping[orderKey]) {
                    orderKey = tableMapping[orderKey];
                }
                options.orderBy = {
                    [orderKey]: orderAscending ? 'asc' : 'desc'
                };
            }
            // Limit
            if (limitCount) {
                options.take = limitCount;
            }
            const rows = await delegate.findMany(options);
            // Map rows back to snake_case structure
            result = rows.map((row)=>{
                if (table === 'profiles') {
                    return {
                        id: row.id,
                        user_id: row.id,
                        role: row.role.toLowerCase(),
                        full_name: row.fullName,
                        phone: row.phone,
                        avatar_url: null,
                        is_active: true,
                        created_at: row.createdAt,
                        updated_at: row.updatedAt
                    };
                }
                if (table === 'sellers') {
                    return {
                        id: row.id,
                        user_id: row.userId,
                        store_name: row.storeName,
                        store_description: row.storeDescription,
                        gst_number: row.gstNumber,
                        pan_number: row.panNumber,
                        bank_account_number: row.bankAccountNo,
                        bank_ifsc: row.bankIfsc,
                        bank_account_name: row.bankAccountName,
                        store_logo_url: row.logoUrl,
                        store_banner_url: row.bannerUrl,
                        business_type: row.businessType,
                        address: row.pickupAddress?.addressLine1 || '',
                        city: row.pickupAddress?.city || row.city || '',
                        state: row.pickupAddress?.state || row.state || '',
                        pincode: row.pickupAddress?.pincode || row.pincode || '',
                        commission_rate: row.commissionRate,
                        status: row.status.toLowerCase(),
                        created_at: row.createdAt,
                        updated_at: row.updatedAt
                    };
                }
                if (table === 'products') {
                    // Parse image JSON to output matching product_images schema
                    let productImages = [];
                    if (row.images) {
                        try {
                            const imgs = JSON.parse(row.images);
                            productImages = imgs.map((img)=>({
                                    url: img.url,
                                    is_primary: img.isPrimary
                                }));
                        } catch (e) {
                            console.warn('Failed to parse product images JSON:', e);
                        }
                    }
                    if (productImages.length === 0) {
                        productImages = [
                            {
                                url: '/placeholder.jpg',
                                is_primary: true
                            }
                        ];
                    }
                    return {
                        id: row.id,
                        seller_id: row.sellerId,
                        title: row.title,
                        price: row.price,
                        compare_price: row.comparePrice,
                        stock: row.stock,
                        category: row.category,
                        short_description: row.shortDescription,
                        description: row.description,
                        sku: row.sku,
                        barcode: row.barcode,
                        status: row.status,
                        tags: row.tags,
                        weight: row.weight,
                        dimension_length: row.dimensionLength,
                        dimension_width: row.dimensionWidth,
                        dimension_height: row.dimensionHeight,
                        created_at: row.createdAt,
                        product_images: productImages
                    };
                }
                if (table === 'orders') {
                    let shippingAddressObj = null;
                    if (row.shippingAddress) {
                        try {
                            shippingAddressObj = typeof row.shippingAddress === 'string' ? JSON.parse(row.shippingAddress) : row.shippingAddress;
                        } catch (e) {
                            console.warn('Failed to parse shipping address JSON:', e);
                        }
                    }
                    const orderItems = (row.items || []).map((item)=>({
                            id: item.id,
                            order_id: item.orderId,
                            product_id: item.productId,
                            title: item.title,
                            price: item.price,
                            quantity: item.quantity,
                            total: item.total,
                            shipment_id: item.shipmentId,
                            sku: item.product?.sku || 'N/A'
                        }));
                    const shipments = (row.shipments || []).map((ship)=>({
                            id: ship.id,
                            shipment_number: ship.shipmentNumber,
                            order_id: ship.orderId,
                            seller_id: ship.sellerId,
                            status: ship.status.toLowerCase(),
                            awb_number: ship.awbNumber,
                            tracking_number: ship.trackingNumber,
                            tracking_link: ship.trackingLink,
                            label_url: ship.labelUrl,
                            cod_amount: ship.codAmount,
                            shipping_cost: ship.shippingCost,
                            weight: ship.weight,
                            dispatch_date: ship.dispatchDate,
                            created_at: ship.createdAt,
                            updated_at: ship.updatedAt
                        }));
                    return {
                        id: row.id,
                        order_number: row.orderNumber,
                        buyer_id: row.buyerId,
                        buyer_name: row.buyer?.fullName || 'N/A',
                        buyer_email: row.buyer?.email || 'N/A',
                        buyer_phone: row.buyer?.phone || 'N/A',
                        seller_id: row.sellerId,
                        seller_name: row.seller?.storeName || 'N/A',
                        status: row.status.toLowerCase(),
                        payment_status: row.paymentStatus.toLowerCase(),
                        payment_method: row.paymentMethod,
                        subtotal: row.subtotal,
                        discount_amount: row.discountAmount,
                        shipping_amount: row.shippingAmount,
                        tax_amount: row.taxAmount,
                        total_amount: row.totalAmount,
                        shipping_address: shippingAddressObj,
                        created_at: row.createdAt,
                        updated_at: row.updatedAt,
                        order_items: orderItems,
                        shipments: shipments
                    };
                }
                if (table === 'reviews') {
                    const names = (row.user?.fullName || 'Customer Account').split(' ');
                    return {
                        id: row.id,
                        rating: row.rating,
                        comment: row.comment,
                        status: row.status,
                        seller_response: row.sellerResponse,
                        created_at: row.createdAt,
                        users: {
                            first_name: names[0] || 'Customer',
                            last_name: names.slice(1).join(' ') || ''
                        },
                        products: {
                            id: row.product?.id,
                            title: row.product?.title,
                            seller_id: row.product?.sellerId
                        }
                    };
                }
                if (table === 'subscriptions') {
                    return {
                        id: row.id,
                        seller_id: row.sellerId,
                        plan: row.planId,
                        billing_cycle: row.billingCycle,
                        status: row.status,
                        start_date: row.startDate,
                        end_date: row.endDate,
                        amount: row.amount,
                        sellers: {
                            store_name: row.seller?.storeName || 'Merchant'
                        }
                    };
                }
                if (table === 'subscription_plans') {
                    let features = [];
                    if (row.features) {
                        try {
                            features = JSON.parse(row.features);
                        } catch (e) {
                            console.warn('Failed to parse subscription plan features JSON:', e);
                        }
                    }
                    return {
                        id: row.id,
                        name: row.name,
                        description: row.description,
                        price: row.price,
                        duration_days: row.durationDays,
                        features
                    };
                }
                return row;
            });
            if (isSingle || isMaybeSingle) {
                result = result[0] || null;
            }
        } else if (action === 'insert') {
            const dataArray = Array.isArray(insertData) ? insertData : [
                insertData
            ];
            const insertedRows = [];
            for (const rawData of dataArray){
                const data = toCamelCaseKeys(rawData);
                // Convert images/features JSON to string
                if (table === 'products') {
                    if (rawData.images) {
                        data.images = typeof rawData.images === 'string' ? rawData.images : JSON.stringify(rawData.images);
                    }
                    if (rawData.variants) {
                        data.variants = typeof rawData.variants === 'string' ? rawData.variants : JSON.stringify(rawData.variants);
                    }
                    if (rawData.price) data.price = parseFloat(rawData.price);
                    if (rawData.comparePrice) data.comparePrice = parseFloat(rawData.comparePrice);
                    if (rawData.stock) data.stock = parseInt(rawData.stock);
                } else if (table === 'subscription_plans' && rawData.features) {
                    data.features = JSON.stringify(rawData.features);
                }
                const newRow = await delegate.create({
                    data
                });
                insertedRows.push(newRow);
            }
            result = Array.isArray(insertData) ? insertedRows : insertedRows[0];
        } else if (action === 'update') {
            const data = toCamelCaseKeys(updateData);
            // Handle nested Pickup Address updates for Sellers table
            if (table === 'sellers') {
                const addressPayload = {};
                let hasAddressUpdate = false;
                if (updateData.address !== undefined) {
                    addressPayload.addressLine1 = updateData.address;
                    hasAddressUpdate = true;
                }
                if (updateData.city !== undefined) {
                    addressPayload.city = updateData.city;
                    hasAddressUpdate = true;
                }
                if (updateData.state !== undefined) {
                    addressPayload.state = updateData.state;
                    hasAddressUpdate = true;
                }
                if (updateData.pincode !== undefined) {
                    addressPayload.pincode = updateData.pincode;
                    hasAddressUpdate = true;
                }
                if (hasAddressUpdate) {
                    // Find matching sellers
                    const targetSellers = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].seller.findMany({
                        where,
                        include: {
                            user: true
                        }
                    });
                    for (const s of targetSellers){
                        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].pickupAddress.upsert({
                            where: {
                                sellerId: s.id
                            },
                            update: addressPayload,
                            create: {
                                sellerId: s.id,
                                storeName: s.storeName,
                                contactName: 'Store Contact',
                                phone: s.gstNumber || '9999999999',
                                email: s.user?.email || 'merchant@example.com',
                                addressLine1: addressPayload.addressLine1 || '',
                                city: addressPayload.city || '',
                                state: addressPayload.state || '',
                                pincode: addressPayload.pincode || ''
                            }
                        });
                    }
                }
                // Clean values before Prisma update
                delete data.address;
                delete data.city;
                delete data.state;
                delete data.pincode;
                // Map camelCase fields that are custom
                if (updateData.bank_account_number !== undefined) data.bankAccountNo = updateData.bank_account_number;
                delete data.bankAccountNumber;
            }
            if (table === 'products') {
                if (updateData.images) {
                    data.images = typeof updateData.images === 'string' ? updateData.images : JSON.stringify(updateData.images);
                }
                if (updateData.variants) {
                    data.variants = typeof updateData.variants === 'string' ? updateData.variants : JSON.stringify(updateData.variants);
                }
                if (updateData.price) data.price = parseFloat(updateData.price);
                if (updateData.comparePrice) data.comparePrice = parseFloat(updateData.comparePrice);
                if (updateData.stock) data.stock = parseInt(updateData.stock);
            }
            if (table === 'subscription_plans' && updateData.features) {
                data.features = JSON.stringify(updateData.features);
            }
            // Convert update parameters to match exact types
            if (data.status && typeof data.status === 'string' && table === 'sellers') {
                data.status = data.status.toUpperCase();
            }
            // Perform updates
            const updatedRows = await delegate.updateMany({
                where,
                data
            });
            result = updatedRows;
        } else if (action === 'delete') {
            const deletedRows = await delegate.deleteMany({
                where
            });
            result = deletedRows;
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Supabase Polyfill Router Error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Prisma query resolution failed.'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1mfk5hg._.js.map