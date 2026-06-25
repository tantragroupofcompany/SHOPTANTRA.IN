const https = require('https');

const endpoints = [
  '/api/seller/store-settings',
  '/api/seller/products',
  '/api/seller/inventory',
  '/api/seller/orders',
  '/api/seller/coupons',
  '/api/seller/earnings',
  '/api/seller/sales-report',
  '/api/seller/analytics',
  '/api/seller/reviews',
  '/api/seller/settings',
  '/api/seller/profile'
];

const BASE_URL = 'https://shoptantra.in';
const TEST_USER_ID = 'test-seller-uuid';

function testEndpoint(path) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}?userId=${TEST_USER_ID}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          success: res.statusCode === 200,
          dataLength: data.length
        });
      });
    }).on('error', (err) => {
      resolve({
        path,
        status: 500,
        success: false,
        error: err.message
      });
    });
  });
}

async function run() {
  console.log('=== VERIFYING LIVE PRODUCTION ENDPOINTS ON https://shoptantra.in ===\n');
  let passedCount = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    if (result.success) {
      console.log(`✅ ${result.path} - HTTP ${result.status} (${result.dataLength} bytes)`);
      passedCount++;
    } else {
      console.log(`❌ ${result.path} - HTTP ${result.status} (Error: ${result.error || 'Failed'})`);
    }
  }
  
  console.log(`\nResults: ${passedCount}/${endpoints.length} endpoints passed.`);
  if (passedCount === endpoints.length) {
    console.log('🎉 All live production seller endpoints are working perfectly!');
    process.exit(0);
  } else {
    console.log('⚠️ Some live endpoints failed.');
    process.exit(1);
  }
}

run().catch(console.error);
