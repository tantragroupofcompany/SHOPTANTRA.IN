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
"[project]/src/lib/prisma.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : [
        'warn'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/src/app/api/seller/store-settings/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
;
;
// Helper to resolve user ID or seller profile ID to seller profile ID
async function resolveSeller(id) {
    if (!id) return null;
    return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].seller.findFirst({
        where: {
            OR: [
                {
                    id: id
                },
                {
                    userId: id
                }
            ]
        },
        include: {
            pickupAddress: true,
            user: true
        }
    });
}
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sellerIdParam = searchParams.get('sellerId') || searchParams.get('userId');
        if (!sellerIdParam) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'sellerId or userId query parameter is required'
            }, {
                status: 400
            });
        }
        const seller = await resolveSeller(sellerIdParam);
        if (!seller) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Seller profile not found'
            }, {
                status: 404
            });
        }
        const formattedSeller = {
            id: seller.id,
            user_id: seller.userId,
            store_name: seller.storeName,
            store_description: seller.storeDescription,
            gst_number: seller.gstNumber,
            pan_number: seller.panNumber,
            bank_account_number: seller.bankAccountNo,
            bank_ifsc: seller.bankIfsc,
            bank_account_name: seller.bankAccountName,
            store_logo_url: seller.logoUrl,
            store_banner_url: seller.bannerUrl,
            business_type: seller.businessType,
            address: seller.pickupAddress?.addressLine1 || '',
            city: seller.pickupAddress?.city || seller.city || '',
            state: seller.pickupAddress?.state || seller.state || '',
            pincode: seller.pickupAddress?.pincode || seller.pincode || '',
            commission_rate: seller.commissionRate,
            status: seller.status.toLowerCase(),
            created_at: seller.createdAt,
            updated_at: seller.updatedAt
        };
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: formattedSeller
        });
    } catch (error) {
        console.error('Error fetching store settings:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function PUT(request) {
    try {
        const body = await request.json();
        const { sellerId: sellerIdParam, userId, store_name, storeDescription, store_description, businessType, business_type, gstNumber, gst_number, panNumber, pan_number, bankAccountNumber, bank_account_number, bankIfsc, bank_ifsc, bankAccountName, bank_account_name, address, city, state, pincode, logoUrl, store_logo_url, bannerUrl, store_banner_url } = body;
        const idToResolve = sellerIdParam || userId;
        if (!idToResolve) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'sellerId or userId is required'
            }, {
                status: 400
            });
        }
        const seller = await resolveSeller(idToResolve);
        if (!seller) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Seller profile not found'
            }, {
                status: 404
            });
        }
        const storeNameVal = store_name !== undefined ? store_name : seller.storeName;
        const storeDescVal = store_description !== undefined ? store_description : storeDescription !== undefined ? storeDescription : seller.storeDescription;
        const bizTypeVal = business_type !== undefined ? business_type : businessType !== undefined ? businessType : seller.businessType;
        const gstVal = gst_number !== undefined ? gst_number : gstNumber !== undefined ? gstNumber : seller.gstNumber;
        const panVal = pan_number !== undefined ? pan_number : panNumber !== undefined ? panNumber : seller.panNumber;
        const bankAcNoVal = bank_account_number !== undefined ? bank_account_number : bankAccountNumber !== undefined ? bankAccountNumber : seller.bankAccountNo;
        const bankIfscVal = bank_ifsc !== undefined ? bank_ifsc : bankIfsc !== undefined ? bankIfsc : seller.bankIfsc;
        const bankAcNameVal = bank_account_name !== undefined ? bank_account_name : bankAccountName !== undefined ? bankAccountName : seller.bankAccountName;
        const logoVal = store_logo_url !== undefined ? store_logo_url : logoUrl !== undefined ? logoUrl : seller.logoUrl;
        const bannerVal = store_banner_url !== undefined ? store_banner_url : bannerUrl !== undefined ? bannerUrl : seller.bannerUrl;
        // Update Seller Info
        const updatedSeller = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].seller.update({
            where: {
                id: seller.id
            },
            data: {
                storeName: storeNameVal,
                storeDescription: storeDescVal,
                businessType: bizTypeVal,
                gstNumber: gstVal,
                panNumber: panVal,
                bankAccountNo: bankAcNoVal,
                bankIfsc: bankIfscVal,
                bankAccountName: bankAcNameVal,
                logoUrl: logoVal,
                bannerUrl: bannerVal
            }
        });
        // Update or Create Pickup Address if address details are sent
        if (address !== undefined || city !== undefined || state !== undefined || pincode !== undefined) {
            const addressLine1 = address !== undefined ? address : seller.pickupAddress?.addressLine1 || '';
            const cityVal = city !== undefined ? city : seller.pickupAddress?.city || seller.city || '';
            const stateVal = state !== undefined ? state : seller.pickupAddress?.state || seller.state || '';
            const pinVal = pincode !== undefined ? pincode : seller.pickupAddress?.pincode || seller.pincode || '';
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].pickupAddress.upsert({
                where: {
                    sellerId: seller.id
                },
                update: {
                    addressLine1,
                    city: cityVal,
                    state: stateVal,
                    pincode: pinVal
                },
                create: {
                    sellerId: seller.id,
                    storeName: storeNameVal,
                    contactName: seller.user?.fullName || 'Store Contact',
                    phone: seller.user?.phone || '9999999999',
                    email: seller.user?.email || 'merchant@example.com',
                    addressLine1,
                    city: cityVal,
                    state: stateVal,
                    pincode: pinVal
                }
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: updatedSeller
        });
    } catch (error) {
        console.error('Error updating store settings:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0fn_4hk._.js.map