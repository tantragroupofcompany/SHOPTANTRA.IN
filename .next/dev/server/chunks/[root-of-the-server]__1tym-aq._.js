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
"[project]/src/app/api/seller/products/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DELETE",
    ()=>DELETE,
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "PUT",
    ()=>PUT
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/prisma.ts [app-route] (ecmascript)");
;
;
// Helper to resolve user ID or seller profile ID to seller profile ID
async function resolveSellerId(id) {
    if (!id) return null;
    const seller = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].seller.findFirst({
        where: {
            OR: [
                {
                    id: id
                },
                {
                    userId: id
                }
            ]
        }
    });
    return seller ? seller.id : null;
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
        const sellerId = await resolveSellerId(sellerIdParam);
        if (!sellerId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Seller profile not found'
            }, {
                status: 404
            });
        }
        const products = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].product.findMany({
            where: {
                sellerId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Format products to return matching camelCase or snake_case as expected
        const formattedProducts = products.map((product)=>{
            let productImages = [];
            if (product.images) {
                try {
                    productImages = JSON.parse(product.images);
                } catch (e) {
                    console.warn('Failed to parse product images JSON:', e);
                }
            }
            if (productImages.length === 0) {
                productImages = [
                    {
                        url: '/placeholder.jpg',
                        isPrimary: true
                    }
                ];
            }
            return {
                id: product.id,
                seller_id: product.sellerId,
                title: product.title,
                price: product.price,
                compare_price: product.comparePrice,
                stock: product.stock,
                category: product.category,
                short_description: product.shortDescription,
                description: product.description,
                sku: product.sku,
                barcode: product.barcode,
                status: product.status,
                tags: product.tags,
                weight: product.weight,
                dimension_length: product.dimensionLength,
                dimension_width: product.dimensionWidth,
                dimension_height: product.dimensionHeight,
                created_at: product.createdAt,
                product_images: productImages
            };
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: formattedProducts
        });
    } catch (error) {
        console.error('Error fetching seller products:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { sellerId: sellerIdParam, userId, title, price, comparePrice, stock, category, shortDescription, description, sku, barcode, status, images, variants, tags, weight, dimensionLength, dimensionWidth, dimensionHeight } = body;
        const idToResolve = sellerIdParam || userId;
        if (!idToResolve) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'sellerId or userId is required'
            }, {
                status: 400
            });
        }
        const sellerId = await resolveSellerId(idToResolve);
        if (!sellerId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Seller profile not found'
            }, {
                status: 404
            });
        }
        if (!title || price === undefined || !category) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing required fields: title, price, category'
            }, {
                status: 400
            });
        }
        const imagesJson = typeof images === 'string' ? images : JSON.stringify(images || []);
        const variantsJson = typeof variants === 'string' ? variants : JSON.stringify(variants || []);
        const newProduct = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].product.create({
            data: {
                sellerId,
                title,
                price: parseFloat(price),
                comparePrice: comparePrice ? parseFloat(comparePrice) : null,
                stock: parseInt(stock) || 0,
                category,
                shortDescription: shortDescription || null,
                description: description || null,
                sku: sku || null,
                barcode: barcode || null,
                status: status || 'draft',
                images: imagesJson,
                variants: variantsJson,
                tags: tags || null,
                weight: weight ? parseFloat(weight) : null,
                dimensionLength: dimensionLength ? parseFloat(dimensionLength) : null,
                dimensionWidth: dimensionWidth ? parseFloat(dimensionWidth) : null,
                dimensionHeight: dimensionHeight ? parseFloat(dimensionHeight) : null
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: newProduct
        });
    } catch (error) {
        console.error('Error creating seller product:', error);
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
        const { id, title, price, comparePrice, stock, category, shortDescription, description, sku, barcode, status, images, variants, tags, weight, dimensionLength, dimensionWidth, dimensionHeight } = body;
        if (!id) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Product ID is required for update'
            }, {
                status: 400
            });
        }
        const updatePayload = {};
        if (title !== undefined) updatePayload.title = title;
        if (price !== undefined) updatePayload.price = parseFloat(price);
        if (comparePrice !== undefined) updatePayload.comparePrice = comparePrice ? parseFloat(comparePrice) : null;
        if (stock !== undefined) updatePayload.stock = parseInt(stock) || 0;
        if (category !== undefined) updatePayload.category = category;
        if (shortDescription !== undefined) updatePayload.shortDescription = shortDescription;
        if (description !== undefined) updatePayload.description = description;
        if (sku !== undefined) updatePayload.sku = sku;
        if (barcode !== undefined) updatePayload.barcode = barcode;
        if (status !== undefined) updatePayload.status = status;
        if (tags !== undefined) updatePayload.tags = tags;
        if (weight !== undefined) updatePayload.weight = weight ? parseFloat(weight) : null;
        if (dimensionLength !== undefined) updatePayload.dimensionLength = dimensionLength ? parseFloat(dimensionLength) : null;
        if (dimensionWidth !== undefined) updatePayload.dimensionWidth = dimensionWidth ? parseFloat(dimensionWidth) : null;
        if (dimensionHeight !== undefined) updatePayload.dimensionHeight = dimensionHeight ? parseFloat(dimensionHeight) : null;
        if (images !== undefined) {
            updatePayload.images = typeof images === 'string' ? images : JSON.stringify(images);
        }
        if (variants !== undefined) {
            updatePayload.variants = typeof variants === 'string' ? variants : JSON.stringify(variants);
        }
        const updatedProduct = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].product.update({
            where: {
                id
            },
            data: updatePayload
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        console.error('Error updating seller product:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            // Try from request body if not in searchParams
            try {
                const body = await request.json();
                if (body && body.id) {
                    const deleted = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].product.delete({
                        where: {
                            id: body.id
                        }
                    });
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        success: true,
                        data: deleted
                    });
                }
            } catch (e) {
            // Fall through
            }
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Product ID is required for deletion'
            }, {
                status: 400
            });
        }
        const deletedProduct = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prisma"].product.delete({
            where: {
                id
            }
        });
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: deletedProduct
        });
    } catch (error) {
        console.error('Error deleting seller product:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: error.message || 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1tym-aq._.js.map