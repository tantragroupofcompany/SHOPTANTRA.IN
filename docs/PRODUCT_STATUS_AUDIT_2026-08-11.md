# Product Status Normalization Audit - 2026-08-11

## STEP 4 VERIFIED ✅
Live production DB has products with `status = 'draft'` (lowercase, non-canonical).

## ROOT CAUSE
- Product status: lowercase (draft, active, rejected, blocked, pending)
- Seller status: uppercase (ACTIVE, PENDING, SUSPENDED, etc.)
- No normalization in supabase-polyfill for products (only sellers)

## FIXES IMPLEMENTED

### Core Changes
1. **supabase-polyfill/route.ts**: Added product status normalization to uppercase (INSERT + UPDATE)
2. **schema.prisma**: Changed default from `"draft"` to `"DRAFT"`
3. **seller/products/route.ts**: Updated default status to `'DRAFT'`
4. **corporate/product-action/route.ts**: All status values → uppercase
5. **founder/dashboard/route.ts**: Product queries use uppercase status

### Frontend Updates
6. **types/index.ts**: Product status type → uppercase enum
7. **admin/Products.tsx**: All status operations → uppercase
8. **seller/Products.tsx**: Filter and display → uppercase
9. **seller/ProductUpload.tsx**: Default status → `'DRAFT'`

### Migration
10. **scripts/fix_product_status.cjs**: Created to fix existing lowercase data

## STATUS MAPPING
- draft → DRAFT
- active → ACTIVE  
- pending → PENDING
- rejected → REJECTED
- blocked → BLOCKED
- archived → ARCHIVED
- inactive → REJECTED (was invalid)

## FILES MODIFIED
✅ src/app/api/supabase-polyfill/route.ts
✅ prisma/schema.prisma
✅ src/app/api/seller/products/route.ts
✅ src/app/api/corporate/product-action/route.ts
✅ src/app/api/founder/dashboard/route.ts
✅ src/types/index.ts
✅ src/views/admin/Products.tsx
✅ src/views/seller/Products.tsx
✅ src/views/seller/ProductUpload.tsx
✅ scripts/fix_product_status.cjs (created)

## NEXT STEPS
1. Run: `node scripts/fix_product_status.cjs`
2. Verify: No lowercase status values in DB
3. Test: Product creation/approval flows
4. Deploy: All code changes to production
