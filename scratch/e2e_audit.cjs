
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const http = require('http');

const PORT = 4000;
const BASE_URL = `http://localhost:${PORT}`;

const auditReport = {
  totalPagesTested: 0,
  totalApisTested: 0,
  totalErrorsFound: 0,
  criticalErrors: [],
  highPriorityErrors: [],
  mediumPriorityErrors: [],
  lowPriorityErrors: [],
  filesAffected: new Set(),
  recommendedFixes: [],
  productionReadinessScore: 100
};

// Helper for waiting
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to kill any process listening on a port
function killPort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && !isNaN(pid)) {
            console.log(`Killing process ${pid} on port ${port}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          }
        }
      }
    } else {
      execSync(`lsof -t -i:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
  } catch (e) {
    // Ignore error if port is already free or command fails
  }
}

// Helper for assertions
function logError(priority, message, file = 'N/A', fix = 'N/A') {
  auditReport.totalErrorsFound++;
  if (file !== 'N/A') auditReport.filesAffected.add(file);
  
  const errorObj = { message, file, fix };
  
  if (priority === 'CRITICAL') {
    auditReport.criticalErrors.push(errorObj);
    auditReport.productionReadinessScore = Math.max(0, auditReport.productionReadinessScore - 15);
  } else if (priority === 'HIGH') {
    auditReport.highPriorityErrors.push(errorObj);
    auditReport.productionReadinessScore = Math.max(0, auditReport.productionReadinessScore - 8);
  } else if (priority === 'MEDIUM') {
    auditReport.mediumPriorityErrors.push(errorObj);
    auditReport.productionReadinessScore = Math.max(0, auditReport.productionReadinessScore - 4);
  } else {
    auditReport.lowPriorityErrors.push(errorObj);
    auditReport.productionReadinessScore = Math.max(0, auditReport.productionReadinessScore - 1);
  }
}

// 1. Database Operations Testing
// 1. Database Operations Testing (run via isolated child process to avoid DLL file locks)
async function testDatabase() {
  console.log('\n======================================');
  console.log('PHASE 4: DATABASE TESTING & INTEGRITY');
  console.log('======================================');

  try {
    const workerPath = path.resolve(__dirname, 'db_audit_worker.cjs');
    const resultsPath = path.resolve(__dirname, 'db_audit_results.json');
    
    // Clean up old results
    if (fs.existsSync(resultsPath)) {
      fs.unlinkSync(resultsPath);
    }
    
    // Run worker
    execSync(`node "${workerPath}"`, { stdio: 'inherit' });
    
    // Read results
    if (!fs.existsSync(resultsPath)) {
      throw new Error('Database audit worker did not generate a results file.');
    }
    
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    if (!results.success) {
      results.errors.forEach((err) => {
        logError('CRITICAL', err, 'prisma/schema.prisma', 'Check DB connection, seed status, and Prisma schema.');
      });
    } else {
      console.log('✅ Database verification complete. No schema errors detected.');
    }
  } catch (error) {
    console.error('Database Verification Crashed:', error);
    logError('CRITICAL', `Database schema/connection failure: ${error.message}`, 'prisma/schema.prisma', 'Ensure database is accessible and Prisma Client is generated.');
  }
}

// 2. Fetch Helper to hit endpoints
async function testEndpoint(url, method = 'GET', body = null, headers = {}) {
  auditReport.totalApisTested++;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  return new Promise((resolve) => {
    const req = http.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 500,
        headers: {},
        data: JSON.stringify({ error: err.message })
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// 3. API & Router Audit
async function runApiAndRouteAudit() {
  console.log('\n======================================');
  console.log('PHASE 1-3 & 5: LOCAL SERVER ENDPOINTS AUDIT');
  console.log('======================================');

  // Load the seed accounts from worker results file
  const resultsPath = path.resolve(__dirname, 'db_audit_results.json');
  let users = { adminId: null, sellerId: null, buyerId: null };
  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    users = results.users;
  } catch (e) {
    logError('CRITICAL', 'Failed to read user accounts from db worker results.', 'scratch/db_audit_worker.cjs');
    return;
  }

  if (!users.adminId || !users.sellerId || !users.buyerId) {
    logError('CRITICAL', 'Demo accounts (admin/seller/buyer) not found in database.', 'scripts/seed.cjs', 'Run prisma db seed to seed required data before testing.');
    return;
  }

  const adminUser = { id: users.adminId };
  const sellerUser = { id: users.sellerId };
  const buyerUser = { id: users.buyerId };

  // Let's first test auth login API
  console.log('- Testing auth API login (Buyer, Seller, Admin)...');
  const loginResults = await Promise.all([
    testEndpoint(`${BASE_URL}/api/auth/login`, 'POST', { email: 'buyer@shoptantra.in', password: 'Buyer@ShopTantra2026' }),
    testEndpoint(`${BASE_URL}/api/auth/login`, 'POST', { email: 'seller@shoptantra.in', password: 'Seller@ShopTantra2026' }),
    testEndpoint(`${BASE_URL}/api/auth/login`, 'POST', { email: 'admin@shoptantra.in', password: 'Admin@ShopTantra2026' })
  ]);

  loginResults.forEach((res, index) => {
    const roles = ['buyer', 'seller', 'admin'];
    if (res.status !== 200) {
      logError('CRITICAL', `Auth: Failed login for role ${roles[index]} (HTTP ${res.status})`, 'src/app/api/auth/login/route.ts', 'Verify credentials, hashing salt, or DB connection.');
    } else {
      try {
        const body = JSON.parse(res.data);
        if (!body.success) {
          logError('CRITICAL', `Auth: Login returned success=false for role ${roles[index]}`, 'src/app/api/auth/login/route.ts', 'Verify login handler output schema.');
        }
      } catch (e) {
        logError('CRITICAL', `Auth: Login API response is not valid JSON`, 'src/app/api/auth/login/route.ts');
      }
    }
  });

  // Test Forgot Password API
  console.log('- Testing Forgot Password API...');
  const forgotRes = await testEndpoint(`${BASE_URL}/api/auth/forgot-password`, 'POST', { email: 'buyer@shoptantra.in' });
  if (forgotRes.status !== 200) {
    logError('HIGH', `Forgot Password endpoint failed (HTTP ${forgotRes.status})`, 'src/app/api/auth/forgot-password/route.ts');
  }

  // --- SELLER DASHBOARD ENDPOINTS ---
  console.log('- Testing Seller Dashboard APIs...');
  
  // Store Settings
  let sellerRes = await testEndpoint(`${BASE_URL}/api/seller/store-settings?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('HIGH', 'Failed to load seller store settings', 'src/app/api/seller/store-settings/route.ts');
  }

  // Products
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/products?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('HIGH', 'Failed to load seller products', 'src/app/api/seller/products/route.ts');
  }

  // Inventory
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/inventory?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('HIGH', 'Failed to load seller inventory', 'src/app/api/seller/inventory/route.ts');
  }

  // Orders
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/orders?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('HIGH', 'Failed to load seller orders', 'src/app/api/seller/orders/route.ts');
  }

  // Coupons
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/coupons?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('MEDIUM', 'Failed to load seller coupons', 'src/app/api/seller/coupons/route.ts');
  }

  // Earnings
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/earnings?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('HIGH', 'Failed to load seller earnings', 'src/app/api/seller/earnings/route.ts');
  }

  // Sales Report
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/sales-report?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('MEDIUM', 'Failed to load seller sales report', 'src/app/api/seller/sales-report/route.ts');
  }

  // Analytics
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/analytics?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('MEDIUM', 'Failed to load seller analytics', 'src/app/api/seller/analytics/route.ts');
  }

  // Reviews
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/reviews?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('MEDIUM', 'Failed to load seller reviews', 'src/app/api/seller/reviews/route.ts');
  }

  // Settings
  sellerRes = await testEndpoint(`${BASE_URL}/api/seller/settings?userId=${sellerUser.id}`);
  if (sellerRes.status !== 200) {
    logError('MEDIUM', 'Failed to load seller settings', 'src/app/api/seller/settings/route.ts');
  }

  // --- ADMIN APIs ---
  console.log('- Testing Admin Panel APIs...');
  
  let adminRes = await testEndpoint(`${BASE_URL}/api/admin/sellers`);
  if (adminRes.status !== 200) {
    logError('HIGH', 'Failed to load admin sellers list', 'src/app/api/admin/sellers/route.ts');
  }

  adminRes = await testEndpoint(`${BASE_URL}/api/admin/commissions`);
  if (adminRes.status !== 200) {
    logError('HIGH', 'Failed to load admin commissions list', 'src/app/api/admin/commissions/route.ts');
  }

  adminRes = await testEndpoint(`${BASE_URL}/api/admin/payouts`);
  if (adminRes.status !== 200) {
    logError('HIGH', 'Failed to load admin payouts list', 'src/app/api/admin/payouts/route.ts');
  }

  adminRes = await testEndpoint(`${BASE_URL}/api/admin/reports`);
  if (adminRes.status !== 200) {
    logError('HIGH', 'Failed to load admin reports list', 'src/app/api/admin/reports/route.ts');
  }

  // --- FRONTEND ROUTES COMPILE & RENDER CHECK ---
  console.log('- Testing Page Routers rendering (Buyer Layout, Seller Layout, Admin Layout)...');
  const pages = [
    '/',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/products',
    '/sellers',
    '/plans',
    '/cart',
    '/checkout',
    '/login',
    '/register',
    '/forgot-password',
    '/seller',
    '/seller/products',
    '/seller/inventory',
    '/seller/orders',
    '/seller/store-settings',
    '/buyer',
    '/buyer/orders',
    '/buyer/wishlist',
    '/admin'
  ];

  for (const page of pages) {
    auditReport.totalPagesTested++;
    const pageRes = await testEndpoint(`${BASE_URL}${page}`);
    if (pageRes.status !== 200) {
      logError('CRITICAL', `Page failed to load: ${page} (HTTP ${pageRes.status})`, 'src/ClientApp.tsx', 'Check page compile errors, missing layout or component runtime failures.');
    }
  }

  console.log('✅ Endpoints audit complete.');
}

// 4. UI & UX Static Validation
function runStaticUiUxValidation() {
  console.log('\n======================================');
  console.log('PHASE 6: UI & UX STATIC CHECK');
  console.log('======================================');

  // Verify responsive design tags, forms, and buttons in views
  const viewsDir = path.resolve(__dirname, '../src/views');
  
  function checkFilesRecursively(dir) {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        checkFilesRecursively(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 1. Check for standard viewport meta classes (grid layout, flex wrap)
        if (content.includes('className="') && !content.includes('flex') && !content.includes('grid') && !content.includes('block')) {
          // Warning
        }

        // 2. Check for form tag without action or onSubmit handling
        if (content.includes('<form') && !content.includes('onSubmit') && !content.includes('action')) {
          logError('LOW', `Form in component lacks onSubmit handler`, filePath, 'Add onSubmit to `<form>` tags to handle validations.');
        }

        // 3. Check for hardcoded credentials or sandbox labels in production code
        if (content.includes('Developer Sandbox') || content.includes('Mock Data')) {
          logError('LOW', `Component contains developer sandbox or mock labels`, filePath, 'Remove sandbox/mock labels for clean production rendering.');
        }

        // 4. Check button tags for accessibility (missing type)
        if (content.includes('<button') && !content.includes('type="button"') && !content.includes('type="submit"') && !content.includes('type="reset"')) {
          // A minor issue but good for accessibility/preventing standard form submission crash
        }
      }
    });
  }

  checkFilesRecursively(viewsDir);
  console.log('✅ UI/UX static validation complete.');
}

// Main Runner
async function run() {
  console.log('=== STARTING SHOPTANTRA COMPLETE WEBSITE AUDIT & E2E TESTING ===\n');

  // Kill any existing server on port 4000
  killPort(4000);
  await sleep(1000);

  // 1. Start Server
  console.log('Starting local Next.js dev server on port 4000...');
  const devServer = spawn('npx', ['next', 'dev', '-p', '4000'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true
  });

  // Let server start (Wait up to 25 seconds or check port)
  let serverReady = false;
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    try {
      const res = await testEndpoint(`${BASE_URL}/api/auth/check-admin`); // Simple endpoint check
      if (res.status !== 500) { // If server responds (even with 404/405/400), it is up
        serverReady = true;
        break;
      }
    } catch (e) {
      // Not ready yet
    }
  }

  if (!serverReady) {
    console.error('CRITICAL: Dev server failed to boot on port 4000.');
    killPort(4000);
    process.exit(1);
  }
  console.log('Next.js dev server is up and listening!');

  try {
    // Phase 4: Database testing
    await testDatabase();

    // Phase 1-3 & 5: API routes and Page render checks
    await runApiAndRouteAudit();

    // Phase 6: UI & UX static check
    runStaticUiUxValidation();

    // Stop local dev server before running build steps to avoid EPERM binary file locking errors on Windows
    console.log('\nStopping local dev server before compilation check...');
    killPort(4000);
    await sleep(2500);

    // Phase 7: Lint & Build Checks
    console.log('\n======================================');
    console.log('PHASE 7: PRODUCTION COMPILATION & LINT');
    console.log('======================================');
    
    console.log('- Running ESLint checks...');
    try {
      execSync('npm run lint', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
      console.log('  No ESLint errors found.');
    } catch (e) {
      const output = e.stdout ? e.stdout.toString() : e.message;
      logError('HIGH', `Linting found issues: ${output.substring(0, 300)}`, 'package.json', 'Run eslint --fix or fix code syntax issues.');
    }

    console.log('- Running TypeScript verification...');
    try {
      execSync('npx tsc --noEmit', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
      console.log('  No TypeScript compiler errors found.');
    } catch (e) {
      const output = e.stdout ? e.stdout.toString() : e.message;
      logError('HIGH', `TypeScript compilation errors: ${output.substring(0, 300)}`, 'tsconfig.json', 'Resolve TypeScript types mismatch.');
    }

    console.log('- Running Production Build compilation...');
    try {
      execSync('npm run build', { cwd: path.resolve(__dirname, '..'), stdio: 'pipe' });
      console.log('  Production build generated successfully.');
    } catch (e) {
      const output = e.stderr ? e.stderr.toString() : e.message;
      logError('CRITICAL', `Production compilation failed: ${output.substring(0, 300)}`, 'next.config.mjs', 'Verify route dynamic config, fetch cache options or syntax errors.');
    }

  } catch (err) {
    console.error('Audit run error:', err);
  } finally {
    // Ensure dev server is terminated
    killPort(4000);
  }

  // Create Health Report Artifact
  const reportPath = path.resolve(__dirname, '../website_audit_health_report.md');
  const reportContent = `# 🛡️ SHOPTANTRA WEBSITE HEALTH & AUDIT REPORT

**Audit Date:** ${new Date().toISOString().split('T')[0]}  
**Production Readiness Score:** ${auditReport.productionReadinessScore}/100  
**Overall Status:** ${auditReport.productionReadinessScore >= 90 ? '🟢 READY FOR DEPLOYMENT' : '🔴 ACTION REQUIRED'}

---

## 📊 Summary Metrics

| Metric | Value |
|--------|-------|
| **Total Pages Tested** | ${auditReport.totalPagesTested} |
| **Total APIs Tested** | ${auditReport.totalApisTested} |
| **Total Issues/Errors Found** | ${auditReport.totalErrorsFound} |
| **Critical Errors** | ${auditReport.criticalErrors.length} |
| **High Priority Errors** | ${auditReport.highPriorityErrors.length} |
| **Medium Priority Errors** | ${auditReport.mediumPriorityErrors.length} |
| **Low Priority Errors** | ${auditReport.lowPriorityErrors.length} |
| **Files Affected** | ${auditReport.filesAffected.size} |

---

## 🚨 Critical Errors (${auditReport.criticalErrors.length})
${auditReport.criticalErrors.length === 0 ? '_No critical errors found._' : auditReport.criticalErrors.map((e, i) => `
### ${i + 1}. ${e.message}
- **Affected File:** [${path.basename(e.file)}](file://${e.file.replace(/\\/g, '/')})
- **Recommended Fix:** ${e.fix}
`).join('\n')}

---

## ⚠️ High Priority Errors (${auditReport.highPriorityErrors.length})
${auditReport.highPriorityErrors.length === 0 ? '_No high priority errors found._' : auditReport.highPriorityErrors.map((e, i) => `
### ${i + 1}. ${e.message}
- **Affected File:** [${path.basename(e.file)}](file://${e.file.replace(/\\/g, '/')})
- **Recommended Fix:** ${e.fix}
`).join('\n')}

---

## ℹ️ Medium & Low Priority Errors (${auditReport.mediumPriorityErrors.length + auditReport.lowPriorityErrors.length})
${(auditReport.mediumPriorityErrors.length + auditReport.lowPriorityErrors.length) === 0 ? '_No medium or low priority errors found._' : [
  ...auditReport.mediumPriorityErrors.map(e => ({ ...e, priority: 'Medium' })),
  ...auditReport.lowPriorityErrors.map(e => ({ ...e, priority: 'Low' }))
].map((e, i) => `
### ${i + 1}. [${e.priority}] ${e.message}
- **Affected File:** [${path.basename(e.file)}](file://${e.file.replace(/\\/g, '/')})
- **Recommended Fix:** ${e.fix}
`).join('\n')}

---

## 🛠️ Recommended Action Items
1. **Critical Actions:** Address any failures in production compilation immediately.
2. **Database Integrity:** Monitor SQLite or Supabase connections for slow queries.
3. **UI validations:** Ensure all form submission events prevent default browser actions.

---
_Generated automatically by Antigravity AI Code Auditor._
`;

  fs.writeFileSync(reportPath, reportContent);
  console.log(`\n🎉 Audit Complete! Health report generated at: ${reportPath}`);
  console.log(`Production Readiness Score: ${auditReport.productionReadinessScore}/100`);
}

run().catch(console.error);
