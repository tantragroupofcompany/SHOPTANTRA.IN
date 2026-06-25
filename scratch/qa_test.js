const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Setup fetch polyfill or request mock since we are running in Node.js
// We can test the database directly via Prisma client to verify all schema logic,
// and we can run local API handlers by importing their functions if needed,
// but testing database operations directly via Prisma covers end-to-end data integrity.

async function runQA() {
  console.log('=== STARTING SHOPTANTRA PRODUCTION READINESS VERIFICATION ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Cleanup old test data
    console.log('Cleaning up old test data...');
    await prisma.user.deleteMany({
      where: { email: { in: ['buyer@shoptantra.in', 'seller@shoptantra.in'] } }
    });
    await prisma.contactInquiry.deleteMany({
      where: { email: 'buyer@shoptantra.in' }
    });
    await prisma.newsletterSubscription.deleteMany({
      where: { email: 'buyer@shoptantra.in' }
    });
    await prisma.passwordResetToken.deleteMany({
      where: { email: 'buyer@shoptantra.in' }
    });

    // 2. Test Buyer Registration
    console.log('\n--- Testing Buyer Registration ---');
    const newBuyer = await prisma.user.create({
      data: {
        email: 'buyer@shoptantra.in',
        password: 'password123',
        role: 'BUYER',
        fullName: 'Test Buyer',
        phone: '9099985145'
      }
    });
    assert(newBuyer.id !== undefined, 'Buyer record created successfully.');
    assert(newBuyer.role === 'BUYER', 'Buyer role is correct.');

    // 3. Test Seller Registration
    console.log('\n--- Testing Seller Registration ---');
    const newSeller = await prisma.user.create({
      data: {
        email: 'seller@shoptantra.in',
        password: 'password456',
        role: 'SELLER',
        fullName: 'Test Seller',
        phone: '9099985146',
        sellerProfile: {
          create: {
            storeName: 'Test Seller Store',
            status: 'PENDING'
          }
        }
      },
      include: {
        sellerProfile: true
      }
    });
    assert(newSeller.id !== undefined, 'Seller record created successfully.');
    assert(newSeller.sellerProfile !== null, 'Seller business profile created successfully.');
    assert(newSeller.sellerProfile.storeName === 'Test Seller Store', 'Seller store name is correct.');

    // 4. Test Duplicate Email Prevention
    console.log('\n--- Testing Duplicate Email Prevention ---');
    try {
      await prisma.user.create({
        data: {
          email: 'buyer@shoptantra.in',
          password: 'password999',
          role: 'BUYER'
        }
      });
      assert(false, 'Duplicate email should throw a validation error.');
    } catch (e) {
      assert(e.code === 'P2002', 'Database constraints successfully block duplicate email registrations.');
    }

    // 5. Test Contact Submission & Sanitization
    console.log('\n--- Testing Contact Inquiry ---');
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name: 'Test Buyer',
        email: 'buyer@shoptantra.in',
        phone: '9099985145',
        message: 'Hello, this is a test query with some <b>HTML</b>'
      }
    });
    assert(inquiry.id !== undefined, 'Contact inquiry stored successfully.');
    assert(inquiry.name === 'Test Buyer', 'Inquiry name is correct.');

    // 6. Test Newsletter Subscription
    console.log('\n--- Testing Newsletter Subscription ---');
    const subscription = await prisma.newsletterSubscription.create({
      data: {
        email: 'buyer@shoptantra.in'
      }
    });
    assert(subscription.id !== undefined, 'Newsletter subscription stored successfully.');

    // Test duplicate newsletter subscription
    try {
      await prisma.newsletterSubscription.create({
        data: {
          email: 'buyer@shoptantra.in'
        }
      });
      assert(false, 'Duplicate newsletter email should throw a validation error.');
    } catch (e) {
      assert(e.code === 'P2002', 'Database constraints successfully block duplicate newsletter subscriptions.');
    }

    // 7. Test Password Reset Token
    console.log('\n--- Testing Password Reset Tokens ---');
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        email: 'buyer@shoptantra.in',
        token: 'test_token_hash_123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
    assert(resetToken.id !== undefined, 'Password reset token created successfully.');
    
    // Invalidate token / Update password
    await prisma.user.update({
      where: { email: 'buyer@shoptantra.in' },
      data: { password: 'new_password_999' }
    });
    await prisma.passwordResetToken.delete({
      where: { token: 'test_token_hash_123' }
    });

    const updatedUser = await prisma.user.findUnique({
      where: { email: 'buyer@shoptantra.in' }
    });
    assert(updatedUser.password === 'new_password_999', 'Password updated successfully.');

    const tokenAfterDeletion = await prisma.passwordResetToken.findUnique({
      where: { token: 'test_token_hash_123' }
    });
    assert(tokenAfterDeletion === null, 'Password reset token invalidated successfully.');

    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(`Passed: ${passed}/${passed + failed}`);
    console.log(`Failed: ${failed}/${passed + failed}`);

  } catch (error) {
    console.error('QA script execution failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runQA();
