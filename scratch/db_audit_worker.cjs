const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function run() {
  const results = {
    success: true,
    errors: [],
    users: {
      adminId: null,
      sellerId: null,
      buyerId: null
    }
  };

  function logWorkerError(message) {
    results.success = false;
    results.errors.push(message);
  }

  try {
    // Cleanup previous audit data
    await prisma.review.deleteMany({ where: { comment: { startsWith: '[AUDIT]' } } });
    await prisma.coupon.deleteMany({ where: { code: { startsWith: 'AUDIT' } } });
    await prisma.product.deleteMany({ where: { title: { startsWith: '[AUDIT]' } } });
    await prisma.orderItem.deleteMany({ where: { title: { startsWith: '[AUDIT]' } } });
    await prisma.order.deleteMany({ where: { orderNumber: { startsWith: 'AUDIT' } } });
    await prisma.seller.deleteMany({ where: { storeName: { startsWith: '[AUDIT]' } } });
    await prisma.user.deleteMany({ where: { email: { in: ['audit_buyer@shoptantra.in', 'audit_seller@shoptantra.in'] } } });

    // Test User Creation
    const user = await prisma.user.create({
      data: {
        email: 'audit_buyer@shoptantra.in',
        password: 'AuditPassword123',
        role: 'BUYER',
        fullName: '[AUDIT] Test Buyer',
        phone: '1234567890'
      }
    });
    if (!user.id) logWorkerError('User table: Failed to create user');

    // Test Seller Creation
    const sellerUser = await prisma.user.create({
      data: {
        email: 'audit_seller@shoptantra.in',
        password: 'AuditPassword123',
        role: 'SELLER',
        fullName: '[AUDIT] Test Seller'
      }
    });
    const seller = await prisma.seller.create({
      data: {
        userId: sellerUser.id,
        storeName: '[AUDIT] Jaipur Blue Pottery II',
        storeDescription: 'Handicrafts store for audit validation.',
        status: 'ACTIVE',
        commissionRate: 10.0
      }
    });
    if (!seller.id) logWorkerError('Seller table: Failed to create seller profile');

    // Create Wallet
    await prisma.vendorWallet.create({
      data: {
        sellerId: seller.id,
        balance: 1000.0,
        pendingEarnings: 500.0
      }
    });

    // Test Product Creation
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        title: '[AUDIT] Jaipur Blue Vase',
        price: 799.0,
        stock: 50,
        category: 'Home & Kitchen',
        status: 'active'
      }
    });
    if (!product.id) logWorkerError('Product table: Failed to create product');

    // Test Order Creation
    const order = await prisma.order.create({
      data: {
        orderNumber: 'AUDIT-' + Math.floor(Math.random() * 1000000),
        buyerId: user.id,
        sellerId: seller.id,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal: 799.0,
        totalAmount: 799.0,
        shippingAddress: JSON.stringify({ name: 'Audit User', address: 'Jaipur' }),
        items: {
          create: [
            {
              productId: product.id,
              title: '[AUDIT] Jaipur Blue Vase',
              price: 799.0,
              quantity: 1,
              total: 799.0
            }
          ]
        }
      },
      include: {
        items: true
      }
    });
    if (!order.id || order.items.length === 0) logWorkerError('Order/OrderItem tables: Failed to create order or items');

    // Test Review Creation
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        rating: 5,
        comment: '[AUDIT] Amazing quality product!'
      }
    });
    if (!review.id) logWorkerError('Review table: Failed to create review');

    // Test Coupon Creation
    const coupon = await prisma.coupon.create({
      data: {
        sellerId: seller.id,
        code: 'AUDITDISC10',
        discountType: 'percentage',
        discountValue: 10.0,
        expiryDate: '2026-12-31'
      }
    });
    if (!coupon.id) logWorkerError('Coupon table: Failed to create coupon');

    // Verify Read/Update CRUD
    const updatedProduct = await prisma.product.update({
      where: { id: product.id },
      data: { price: 899.0 }
    });
    if (updatedProduct.price !== 899.0) logWorkerError('Product CRUD: Price update failed');

    // Cleanup Audit Data
    await prisma.review.delete({ where: { id: review.id } });
    await prisma.coupon.delete({ where: { id: coupon.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.product.delete({ where: { id: product.id } });
    await prisma.vendorWallet.delete({ where: { sellerId: seller.id } });
    await prisma.seller.delete({ where: { id: seller.id } });
    await prisma.user.delete({ where: { id: sellerUser.id } });
    await prisma.user.delete({ where: { id: user.id } });

    // Find the seed accounts to get user IDs
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const seedSellerUser = await prisma.user.findFirst({ where: { role: 'SELLER' } });
    const seedBuyerUser = await prisma.user.findFirst({ where: { role: 'BUYER' } });

    if (adminUser) results.users.adminId = adminUser.id;
    if (seedSellerUser) results.users.sellerId = seedSellerUser.id;
    if (seedBuyerUser) results.users.buyerId = seedBuyerUser.id;

  } catch (err) {
    results.success = false;
    results.errors.push(`Database connection/query failure: ${err.message}`);
  } finally {
    await prisma.$disconnect();
    fs.writeFileSync(
      path.resolve(__dirname, 'db_audit_results.json'),
      JSON.stringify(results, null, 2)
    );
  }
}

run().catch((e) => {
  fs.writeFileSync(
    path.resolve(__dirname, 'db_audit_results.json'),
    JSON.stringify({ success: false, errors: [e.message], users: {} }, null, 2)
  );
  process.exit(1);
});
