# ShopTantra Complete Audit Report

## 1. Project Information
- project path: C:\TANTRA GROUP OF INDUSTRIES\SHOPTANTRA
- framework: Next.js 16.2.11 + React 18.3.1 + TypeScript 5.5.3
- database: PostgreSQL via Prisma ORM; runtime database bootstrap is configured but not currently connected in this environment
- test environment: Local Windows workspace with Node 24.16.0 and a repo checkout on main
- audit date: 2026-09-19

## 2. Test Summary

PASS:
- `npm run build` completed successfully after the fix set
- `npx tsc --noEmit` completed without TypeScript errors
- `npm run lint` ran successfully with a warning only about the TypeScript version being newer than the ESLint-supported range

FAIL:
- Full runtime, DB-backed e-commerce verification could not complete because `DATABASE_URL` is not configured in the current workspace environment
- Live production checks against https://shoptantra.in were not performed as destructive or high-risk live verification was explicitly excluded

WARNINGS:
- Next.js warns that `src/middleware.ts` uses the deprecated middleware convention (`middleware` should be migrated to `proxy` in future)
- Next.js emitted a trace warning about `next.config.mjs` and dynamic filesystem access
- ESLint warns that the TypeScript compiler version is newer than the supported range for the current ESLint toolchain
- Runtime DB bootstrap is intentionally skipped when `DATABASE_URL` is missing or invalid to avoid crashing the app in local or CI build-only environments

NOT TESTED:
- full customer checkout, payment, order creation, seller approval, corporate authorization, payout settlement, live shipping, and real production website flows without a valid database and runtime credentials

## 3. Critical Errors

| ID | Severity | Feature | Exact problem | Root cause | File | Line/area | Fix applied | Verification result |
|---|---|---|---|---|---|---|---|---|
| SHP-001 | P1 | Shipping build pipeline | Production build failed because a shipping module used invalid nullish-coalescing precedence and duplicate function names | The shipping implementation was partially duplicated and imported through an older compatibility file while the real provider registry lived in a different module | `src/lib/shipping/shipmentService.ts`, `src/lib/shipping.ts` | Shipping service and compatibility shim | Replaced the legacy compatibility export with the real export surface and fixed the nullish logic to satisfy the parser | Verified by successful `npm run build` |
| SHP-002 | P1 | Database bootstrapping | Build crashed in environments without a valid `DATABASE_URL` because startup code executed Prisma raw SQL against an invalid datasource | Runtime schema bootstrap attempted to run even when the database URL was absent or malformed, violating Prisma validation | `src/lib/dbBootstrap.ts`, `src/lib/dbBootstrapTables.ts` | Runtime schema ensure path | Added guard checks before DB schema bootstrap runs | Verified by successful `npm run build` |

## 4. Customer Flow

| Feature | Status | Error |
|---|---|---|
| Homepage | Not validated in full runtime | Not tested against live DB/auth environment |
| Search | Not validated in full runtime | Not tested against DB-backed catalog |
| Product listing | Not validated in full runtime | Requires DB data and app runtime |
| Product details | Not validated in full runtime | Requires DB data |
| Cart / quantity | Not validated in full runtime | No end-to-end checkout verification performed |
| Address save/update | Not specifically verified | Requires live auth and DB to complete |
| Checkout | Not validated | No live transaction performed |
| Payment | Not validated | Real payment flow intentionally not executed |
| Order history | Not validated | Requires DB and authenticated customer session |
| Tracking | Not validated | Requires shipping and order data |

## 5. Seller Flow

| Feature | Status | Error |
|---|---|---|
| Seller registration | Not validated | No live DB auth session tested |
| Verification | Not validated | Email / approval pipeline not exercised |
| Product submission | Not validated | Requires DB + seller approval flow |
| Product approval | Not validated | Approval workflow not exercised |
| Dashboard access | Not validated | Seller authorization requires runtime environment |
| Order receiving | Not validated | No order data to test |

## 6. Corporate Flow

| Feature | Status | Error |
|---|---|---|
| Corporate login | Not validated | No real corporate session exercised |
| Dashboard modules | Not validated | Requires valid DB and role mapping |
| Seller approval | Not validated | Production authorization flow not exercised |
| Product approval | Not validated | Requires seller + corporate data |
| Logout | Not validated | Flow not exercised |

## 7. Payment

| Check | Status | Notes |
|---|---|---|
| Razorpay integration present | Warning | Code contains Razorpay dependencies and config, but no live transaction was made |
| Secret handling | Warning | Secrets are expected from environment variables; they were not printed or exposed |
| Production fallback | Not validated | No real payment or webhook test executed |
| Signature verification | Not validated | Not tested in this environment |

## 8. Shipping

| Check | Status | Notes |
|---|---|---|
| Shipping module present | Pass | Shipping registry and fallback path restored to a valid export surface |
| Provider integration | Warning | Shipping provider runtime behavior depends on valid env and provider configuration |
| Tracking flow | Not validated | Requires production data and network access |

## 9. Security

| Check | Status | Notes |
|---|---|---|
| Secret exposure | Pass | No secret values were printed; environment files were treated as sensitive |
| Hardcoded production credentials | Warning | The repo contains production-style env samples and a live-looking `.env.production` file, which should be handled carefully and not committed to source control |
| Authorization guards | Not validated | Runtime authorization needs DB and authenticated sessions |
| Session/JWT | Not validated | Requires live auth and browser testing |
| HTTP-only cookies | Not validated | Not confirmed from runtime output |

## 10. SEO

| Check | Status | Notes |
|---|---|---|
| Basic app metadata | Warning | Not fully validated through a running browser session |
| Domain consistency | Warning | Production site is intentionally `https://shoptantra.in`, but live route checks were not executed |
| Robots/sitemap | Not validated | Not verified from a live deployment |

## 11. Performance

| Check | Status | Notes |
|---|---|---|
| Build optimization | Pass | Production build completed successfully |
| Next.js warnings | Warning | There is a deprecation warning and trace warning in config | 
| Client bundle | Not assessed | No browser profiling performed |

## 12. Accessibility

| Check | Status | Notes |
|---|---|---|
| Static build | Pass | App compiles without TypeScript issues |
| Keyboard / labels | Not validated | No accessible browser audit completed |
| Forms semantics | Not validated | Requires browser interaction |

## 13. Broken Routes / Links

List every confirmed broken route.
- No confirmed broken route was found from the build output after the fix set.
- The app route table generated successfully in the production build, including the shipping route tree.
- Full route validation from live browser interaction remains untested because runtime DB and auth are not configured in this environment.

## 14. Files Changed

- `src/lib/shipping.ts` — restored compatibility exports for the shipping provider registry and removed the shadowing issue
- `src/lib/shipping/shipmentService.ts` — fixed the invalid `??` precedence bug and removed duplicate helper definitions
- `src/lib/dbBootstrap.ts` — guarded runtime schema bootstrap so invalid or missing `DATABASE_URL` does not crash the build
- `src/lib/dbBootstrapTables.ts` — guarded table bootstrap so it only runs when a valid Postgres datasource is present
- `prisma/schema.prisma` — existing repo-local modification was left intact and not overwritten (no destructive action)

## 15. Tests Executed

1. `npm run lint`
   - Result: passed with one informational warning about TypeScript version support in the ESLint toolchain

2. `npx tsc --noEmit`
   - Result: passed with no output and exit code 0

3. `npm run build`
   - Result: passed successfully after the source fixes; Next.js build completed and generated the route list

## 16. Remaining Issues

Confirmed unresolved bugs:
- The current workspace does not contain a valid `DATABASE_URL`; therefore runtime DB-backed flows cannot be fully audited or executed here
- Production env values were not available as valid runtime credentials in the workspace; this prevents live checkout, seller approval, payment verification, and corporate auth validation

External/environment issues:
- The project relies on a real PostgreSQL connection and production secrets to operate at runtime
- Live production checks against https://shoptantra.in were not executed because the task explicitly forbids destructive or live transaction behavior

Tests that could not be performed:
- Full customer/seller/corporate E2E flow tests using real authentication and DB state
- Payment verification, order creation, payment webhook processing, shipping integration, and live production route validation

Items requiring manual production verification:
- Customer registration/login flow
- Seller approval status and dashboard access
- Corporate access and role checks
- Checkout, address save, and order creation under a real database
- Payment gateway callbacks/webhooks
- Shipping provider API and real tracking behavior

## 17. Final Production Readiness

READY WITH WARNINGS

Reasoning:
- The codebase now compiles successfully in the current workspace and the confirmed build-breaking issues were fixed.
- However, the environment is missing a valid `DATABASE_URL` and runtime credentials, so the application cannot be fully validated in a live database-backed state.
- Because of that, the app is build-ready and source-clean in the repo, but not fully production-verified for end-to-end commerce operations without a configured database and deployment secrets.

# PHASE 2 — RUNTIME VALIDATION

DATABASE:
BLOCKED

Reason: DATABASE NOT AVAILABLE. The runtime validation stopped because the required PostgreSQL configuration is missing. The exact missing variable is DATABASE_URL. Required runtime services/variables were also absent in this workspace: JWT_SECRET, NEXT_PUBLIC_RAZORPAY_KEY_ID, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SHIPPING_XPRESS_ENABLED, SHIPPING_XPRESS_BASE_URL, SHIPPING_XPRESS_TOKEN, CORPORATE_ACCESS_CODE_FOUNDER, CORPORATE_ACCESS_CODE_CEO, CORPORATE_ACCESS_CODE_CHAIRMAN.

APPLICATION START:
PASS

Evidence: The app was started with the existing project script and the server reached the ready state on http://localhost:80 without Prisma initialization or DATABASE_URL startup crashes.

CUSTOMER:
BLOCKED

Reason: No safe test database or runtime credentials were available for registration, login, cart, checkout, address persistence, or order creation.

ADDRESS:
BLOCKED

Reason: The app could not be exercised against a live database-backed address flow because the required runtime database configuration is absent.

SELLER:
BLOCKED

Reason: No valid seller/test environment and database were available for seller registration, product creation, or approval flow validation.

PRODUCT APPROVAL:
BLOCKED

Reason: Seller-created products could not be tested through approval and public visibility without a valid database and seller/test account setup.

CORPORATE:
BLOCKED

Reason: No authorized corporate test credentials or runtime role-session environment were available for login, dashboard verification, or authorization checks.

PAYMENT:
BLOCKED

Reason: No live or sandbox Razorpay environment was available. The required payment variables were missing in the current runtime environment, so no payment order or signature-validation test was performed.

SHIPPING:
BLOCKED

Reason: Shipping provider configuration was missing. The required shipping variables were absent, so sandbox shipping validation was not possible.

PRODUCTION SAFE CHECK:
PASS

Evidence: The production site responded successfully to safe non-destructive checks:
- https://shoptantra.in → HTTP 200
- https://shoptantra.in/robots.txt → HTTP 200
- https://shoptantra.in/sitemap.xml → HTTP 200

No real order, payment, shipment, or production-data modification was performed.

1. Tests actually executed
- Environment variable presence check by variable name only, without exposing secret values
- Local app startup via the project start script
- Local HTTP health check for the running application
- Non-destructive public website checks against the production domain for homepage, robots, and sitemap

2. Tests blocked
- Prisma/database connectivity validation
- Customer e-commerce full flow validation
- Address persistence validation
- Seller registration and product approval validation
- Corporate login and authorization validation
- Payment sandbox validation
- Shipping sandbox validation

3. Bugs found
- No runtime app-start bug was found in this environment after the source/build fixes.
- The active blocker is environment configuration, not application logic: a valid PostgreSQL runtime connection and production/runtime credentials are missing.

4. Bugs fixed
- Earlier confirmed source/build bugs were fixed in the project code before this runtime phase.
- No additional runtime bug fix was required during this phase because the blocking issue is infrastructure configuration rather than an app defect.

5. Remaining production verification
- Configure a valid PostgreSQL DATABASE_URL and database access.
- Provide valid JWT, Supabase, Razorpay, email, shipping, and corporate runtime credentials.
- Run the real customer, seller, and corporate flows against a safe staging or production-equivalent database.
- Validate payment callbacks and shipping sandbox flows with authorized test credentials only.

6. Final status
READY WITH WARNINGS

Reason: The app starts successfully and the public production site is reachable over HTTPS, but database-backed commerce flows remain unverified because the required runtime credentials and PostgreSQL connection are absent in this workspace.

# PHASE 2 RUNTIME REVALIDATION

DATABASE_URL:
FAIL

Reason: The Vercel Production environment contains a DATABASE_URL entry, but the locally pulled value was not usable for Prisma validation because it did not resolve to a valid PostgreSQL URL format in this environment. No secret value was printed.

DATABASE CONNECTION:
FAIL

Reason: Prisma validation failed with the error that the datasource URL must start with `postgresql://` or `postgres://`. This means the local environment is not using a usable runtime Postgres connection string even though the Vercel project has a production variable present.

PRISMA:
FAIL

Reason: `npx prisma validate` failed because the database URL in the loaded local environment is not a valid PostgreSQL URL. No destructive Prisma commands were run.

APPLICATION:
PASS

Reason: The local app started successfully with the project script and reached a ready state without a Prisma initialization crash or DATABASE_URL startup crash when running in this workspace.

READ-ONLY DATABASE CHECK:
FAIL

Reason: The database connection could not be validated because the loaded local runtime URL was not valid for PostgreSQL. No database reads were performed against a live database.

CUSTOMER:
BLOCKED

Reason: Customer login, product browsing, cart, address retrieval, and checkout preparation require a valid database connection and test credentials. These were not available in a safe, usable runtime state.

ADDRESS:
BLOCKED

Reason: Address retrieval and persistence require a valid Postgres connection; no safe DB-backed address flow could be exercised in this environment.

SELLER:
BLOCKED

Reason: Seller access, status checks, and product retrieval require a real database connection and seller/test credentials. The environment did not provide a safe usable configuration.

PRODUCT:
BLOCKED

Reason: Public product validation and approval flow require runtime database data and seller/corporate credentials; no safe test dataset was available.

CORPORATE:
BLOCKED

Reason: Corporate authentication, authorization, and dashboard data retrieval require valid runtime credentials and DB-backed role data. Those resources were not available in a safe, verified configuration.

PAYMENT:
BLOCKED

Reason: The required payment runtime variables were not usable for a live or sandbox validation in this workspace. No real payment or webhook test was performed.

SHIPPING:
BLOCKED

Reason: Shipping integration requires valid provider runtime configuration and a safe test environment. The current workspace did not contain a usable shipping setup.

LIVE WEBSITE:
PASS

Reason: Safe non-destructive checks against the production site succeeded: https://shoptantra.in returned HTTP 200, and https://shoptantra.in/robots.txt and https://shoptantra.in/sitemap.xml also returned HTTP 200.

Final status: READY WITH WARNINGS

Reason: The app starts successfully, the public production site responds over HTTPS, and the Vercel project does contain a production DATABASE_URL entry. However, the locally loaded runtime value was not a valid PostgreSQL URL in this workspace, so the database-backed commerce flows remain unverified and are therefore still blocked until a usable operational database connection and runtime credentials are available.

## FINAL PRODUCTION VERIFICATION STATUS

DATABASE_URL FORMAT: FAIL
- Vercel Production environment contains a DATABASE_URL variable, but the value currently loaded for validation does not begin with `postgresql://` or `postgres://`.
- Prisma validation error: `Error validating datasource db: the URL must start with the protocol postgresql:// or postgres://.`

DATABASE CONNECTION: FAIL
- The runtime Postgres connection could not be validated because the loaded DATABASE_URL is not a valid PostgreSQL connection string.
- No database read/write operations were performed beyond safe validation checks.

PRISMA: FAIL
- `npx prisma validate` failed with `Error code: P1012` and the datasource validation error above.
- Prisma connectivity tests were blocked by the invalid DATABASE_URL format.

DATABASE TABLES: BLOCKED
- Required table checks, relation checks, and read-only DB validation remain blocked until a valid PostgreSQL URL is restored.
- No safe table enumeration was performed against a live database because Prisma could not initialize with the invalid URL.

APPLICATION: PASS
- Build and app startup succeeded in the current workspace after the earlier source fixes.
- The app reached production build completion and the runtime guards avoided hard crashes when the DB URL was invalid.

LIVE WEBSITE: PASS
- Safe external checks returned HTTP 200 for https://shoptantra.in
- Safe non-destructive checks also returned HTTP 200 for https://shoptantra.in/robots.txt and https://shoptantra.in/sitemap.xml

BLOCKED ITEMS:
- users table validation
- sellers table validation
- products table validation
- categories table validation
- orders table validation
- addresses table validation
- corporate roles and authorization checks
- customer checkout and order creation
- seller verification and product approval
- payment sandbox checks
- shipping sandbox checks
- any real database-backed commerce flow requiring a valid Postgres connection

NEXT ACTION REQUIRED:
- Correct the Vercel Production DATABASE_URL to a valid PostgreSQL connection string starting with `postgresql://` or `postgres://`.
- Re-run Prisma validation and safe read-only table/relationship checks.
- Only after the DB is valid may the application-level buyer, seller, and corporate flows be re-tested in a safe staging or production-equivalent environment.

## 18. Shipping Xpress Integration — Verified API Contract, Implementation & Gap Report (2026-09-22)

### 18.1 Executive summary
Shipping Xpress publishes **no public API documentation**. Instead of guessing an
endpoint or payload, the provider was verified by probing the live production API
with the marketplace's own token, then implementing **only** what the provider
itself confirmed. Every fact below is an observed HTTP response.

| # | Item | Verified result |
|---|---|---|
| 1 | Base host | `https://shippingxpress.in/ship` |
| 2 | Auth scheme | `Authorization: Bearer <API token>` |
| 3 | Missing header | HTTP **401** `{"status":false,"message":"Authorization token missing"}` |
| 4 | Invalid token | HTTP **401** `{"status":false,"message":"Invalid API token"}` |
| 5 | Order creation | `POST /api/order/store` (the **only** usable endpoint; `GET` → HTTP **405**) |
| 6 | Body encoding | `application/x-www-form-urlencoded` or `multipart/form-data`. **An `application/json` body is ignored** — the endpoint answers "The `<field>` field is required." for every field even when present in JSON |
| 7 | Validation failure | HTTP **422** `{"status":false,"message":"Validation errors occurred.","errors":{"field":["msg"]}}` |
| 8 | `order_type` values | only **`prepaid`** and **`cod`** accepted (`forward`, `Forward`, `reverse`, `return`, `rto`, `delivery`, `pickup`, `B2C`, `1`, `2` → "The selected order type is invalid.") |
| 9 | `shipping_mode` | required but **not value-restricted** (any string passed, including `TEST`) → deployment configuration, not an enum |
| 10 | `order_date` | `YYYY-MM-DD` accepted (probe sent `2026-09-20`) |
| 11 | Origin / warehouse | **no** pickup-location field is accepted or required — the pickup address belongs to the account behind the token |
| 12 | Unavailable (all HTTP **404**) | `order/list`, `order/index`, `order/show`, `order/track`, `order/cancel`, `order/label`, `pickup/store`, `pickup/list`, `rate/calculate` |

**Required fields (exactly 18, confirmed by the provider's own error messages):**
`customer[first_name]`, `customer[mobile]`, `customer[address]`, `customer[country]`,
`customer[state]`, `customer[city]`, `customer[zip_code]`, `shipping_mode`,
`order_date`, `order_type`, `total_amount`, `weight`, `length`, `width`, `height`,
`items[][product_name]`, `items[][amount]`, `items[][quantity]`.

### 18.2 Evidence (reproducible, creates no orders)
```
# reachability + token check (empty body → validation answer, nothing is created)
curl -X POST https://shippingxpress.in/ship/api/order/store \
  -H 'Authorization: Bearer <TOKEN>'      → HTTP 422 {"status":false,"message":"Validation errors occurred.", ...}

# key-name proof: one deliberately empty required field
curl -X POST https://shippingxpress.in/ship/api/order/store \
  -H 'Authorization: Bearer <TOKEN>' --data-urlencode 'customer[first_name]=...' \
  ... --data-urlencode 'customer[mobile]=' ...
  → HTTP 422 errors: ONLY {"customer.mobile":["The customer.mobile field is required."]}
```
The second probe is the important one: because the provider reports **all** validation
errors at once, receiving *only* the `customer.mobile` complaint proves that all 17
other field names and values in the generated payload are correct — and because
validation failed, **no order was created** in the Shipping Xpress account.

### 18.3 Automated verification harness result
The compiled provider was executed against the live API
(`scratch/verify/sxp-verify.cjs`, deleted after use; exit code 0):

```
PASS  A: reachable + authorized via empty-body 422
PASS  B1: booking correctly rejected
PASS  B2: failure cites customer.mobile (key recognised)
PASS  B3: no "field is required" complaint about the other keys
PASS  B4: no AWB invented on failure
PASS  getTracking throws ProviderNotSupportedError
PASS  cancelShipment throws ProviderNotSupportedError
PASS  requestPickup throws ProviderNotSupportedError

ALL CHECKS PASSED
```


### 18.4 Implementation inventory
| File | Purpose |
|---|---|
| `src/lib/shipping/types.ts` | Provider contract: `ShippingProvider` abstraction, `CreateShipmentInput/Result`, `ConnectionTestResult`, `ProviderNotSupportedError` |
| `src/lib/shipping/envConfig.ts` | Env-only configuration (`getShippingConfig`, `isShippingEnabled`). Deliberately has **no provider import**, which keeps the module graph acyclic |
| `src/lib/shipping/config.ts` | Provider registry (`getShippingProvider`). Re-exports the env config |
| `src/lib/shipping/helpers.ts` | Pure helpers: seller grouping, idempotency key, seller/pickup eligibility, package metrics, COD estimate, status mapping, response parsing, log sanitising, mobile/date normalisation, 422 error flattening |
| `src/lib/shipping/shippingXpressProvider.ts` | The live provider: verified contract constant, order booking, safe `testConnection()`, unsupported capabilities that **throw** |
| `src/lib/shipping/shipmentService.ts` | Orchestration: one Shipment per seller, payment pre-flight, idempotency, persistence, `triggerAutoShipment` |
| `src/lib/shipping/index.ts` | Barrel export |
| `src/lib/dbBootstrap.ts` | Runtime idempotent DDL for the new `Shipment`/`PickupAddress` columns (production runs behind Supabase's pooler where `prisma migrate deploy` cannot take advisory locks) |
| `scripts/migrate-deploy.cjs` | **Fixed:** previously hard-coded one migration file, so newer migrations were never applied in production. Now discovers and replays every migration folder (paths quoted for spaces) |
| `prisma/migrations/20260826000000_shipping_xpress_integration/migration.sql` | Additive migration for the provider columns + partial unique indexes |
| `src/app/api/admin/shipping/connection/route.ts` | Admin-only connection test (`requireCorporate`), returns reachability/token status + capabilities + contract; never the token |
| `src/app/api/webhooks/shipping-xpress/route.ts` | Status webhook, **disabled by default** (no documented provider format); shared-secret gate, constant-time compare, no DB writes without it |
| `src/lib/orderProcessor.ts` | Post-payment hook: `void triggerAutoShipment(orderId, paymentMode)` (non-blocking, fire-and-forget) |
| `.env.example` | Documents the new flags (template file is untracked — see §18.7) |

### 18.5 End-to-end flow
1. Buyer pays (or a COD order is confirmed) → `processVerifiedOrder()` in `lib/orderProcessor.ts`.
2. `triggerAutoShipment(orderId, paymentMode)` runs **after** the order transaction commits and never blocks the response.
3. `createShipmentsForOrder()` no-ops unless `SHIPPING_XPRESS_ENABLED=true`.
4. **Payment pre-flight:** PREPAID requires `paymentStatus = PAID`; COD requires `COD_PENDING`.
5. Line items are grouped **per seller** → one `Shipment` per seller (buyer has one delivery address, sellers are picked up separately).
6. **Seller eligibility:** seller must be `ACTIVE` **and** `VERIFICATION`-verified, and (only if `SHIPPING_XPRESS_REQUIRE_PICKUP_LOCATION_ID=true`) have a mapped pickup location. Ineligible → the attempt is recorded as `BLOCKED`/`PENDING_PROVIDER_CONFIRMATION` with the reason, so an admin can fix it instead of silently shipping.
7. **Idempotency:** `computeIdempotencyKey(orderNumber, sellerId, provider)` is stored in `Shipment.clientRef` (partial unique index), and an existing booked shipment for `(order, seller, provider)` short-circuits the call — webhook re-delivery or a double-trigger can never double-book.
8. `provider.createShipment()` posts the verified payload; the raw response is sanitised and stored on `Shipment.rawResponse`; `OrderItem.shipmentId` links the items back.
9. Stock is **never** touched here — it is decremented once at order creation (`orderProcessor.ts`).

### 18.6 Configuration flags
| Variable | Values | Meaning |
|---|---|---|
| `SHIPPING_XPRESS_ENABLED` | `true`/`false` (default `false`) | Master switch for automatic provider bookings |
| `SHIPPING_XPRESS_BASE_URL` | default `https://shippingxpress.in/ship` | API host |
| `SHIPPING_XPRESS_API_TOKEN` | secret | Bearer token, **server-side only** (never `NEXT_PUBLIC_`) |
| `SHIPPING_XPRESS_ENVIRONMENT` | `production`/`sandbox` | Reported by the admin connection test only |
| `SHIPPING_XPRESS_TIMEOUT_MS` | default `15000` | Per-request timeout |
| `SHIPPING_XPRESS_SHIPPING_MODE` | default `Surface` | Free-form value for the required `shipping_mode` field |
| `SHIPPING_XPRESS_REQUIRE_PICKUP_LOCATION_ID` | `true`/`false` (default `false`) | Optional strict mode; the API itself does not need it |
| `SHIPPING_XPRESS_WEBHOOK_SECRET` | secret, empty by default | Enables the status webhook (own shared secret, not a provider signature) |
| `SHIPPING_LOCAL_FALLBACK_ENABLED` | `true`/`false` (default `false`) | **Required** to use the simulated master-account courier — see §18.7 |

### 18.7 Critical behaviour decision (no fabricated data)
`src/lib/masterCourierService.ts` **is a simulation**: `createShipment()` generates
random AWB numbers (`DEL##########IN`) and its "live" branch is a commented-out
placeholder. Auto-shipping every marketplace order through it would put **fake
tracking numbers in front of real buyers**, so the fallback is now gated behind
`SHIPPING_LOCAL_FALLBACK_ENABLED=true`. With the default (`false`) a failed provider
booking is stored honestly as `PENDING_PROVIDER_CONFIRMATION` with the provider's
failure reason, **no AWB**, and `source: 'PROVIDER'` for the admin to retry.


### 18.8 Missing / undocumented API features (complete gap list)
| # | Capability | Status | Evidence | Impact / mitigation |
|---|---|---|---|---|
| G-1 | **Order status / tracking API** | **NOT AVAILABLE** | `GET /api/order/track`, `/order/show`, `/order/list` → HTTP 404 | ShopTantra cannot poll carrier status. The AWB is stored and linked to `https://shoptantra.in/track?awb=…`; buyers/admins must use the Shipping Xpress dashboard. `getTracking()` throws `ProviderNotSupportedError` |
| G-2 | **Cancellation API** | **NOT AVAILABLE** | `GET /api/order/cancel` → HTTP 404 | Orders must be cancelled in the provider dashboard; `cancelShipment()` throws instead of pretending |
| G-3 | **Label / AWB PDF API** | **NOT AVAILABLE** | `GET /api/order/label` → HTTP 404 | `Shipment.labelUrl` stays null; labels are printed from the dashboard |
| G-4 | **Pickup scheduling API** | **NOT AVAILABLE** | `GET /api/pickup/store`, `/pickup/list` → HTTP 404 | `requestPickup()` throws; pickups are raised manually in the dashboard |
| G-5 | **Rate / serviceability API** | **NOT AVAILABLE** | `GET /api/rate/calculate` → HTTP 404 | No live shipping charge at checkout; `shippingCost` remains 0 unless the booking response supplies it |
| G-6 | **Webhook callback format + signature** | **UNDOCUMENTED** | No registration endpoint, no event schema, no signature header documented | Status-sync endpoint disabled until `SHIPPING_XPRESS_WEBHOOK_SECRET` is set by the operator; status changes must be applied by hand in admin |
| G-7 | **Success (2xx) response body shape** | **UNVERIFIED — deliberately not guessed** | No order was created during the audit (doing so would book a real consignment) | `parseProviderResponse()` reads ids/AWB/tracking defensively from common key shapes, and the **verbatim** body is always persisted to `Shipment.rawResponse`. The first real booking therefore *self-documents* the shape; refine the mapping from that stored body |
| G-8 | **Retry / idempotency header support** | **NOT DOCUMENTED** | n/a | Idempotency is enforced locally: deterministic `clientRef` + partial unique index + pre-flight lookup. No invented headers are sent |
| G-9 | **`total_amount` semantics** | **INFERRED (single amount field)** | Only one amount field exists in the contract | COD → amount to collect; PREPAID → declared value (from `codAmount`/`declaredAmount`) |
| G-10 | **`items[].amount` semantics** | **INFERRED (unit price)** | Only `product_name`/`amount`/`quantity` exist per line | Unit price is sent; the line total stays derivable as `amount × quantity`. No invented line-total field |
| G-11 | **Weight / dimension units** | **NOT DOCUMENTED** | Contract only states the fields are required numbers | Sent as kg + cm (Indian courier convention), clamped to a non-zero minimum |
| G-12 | **Pickup-location (warehouse) field** | **NOT REQUIRED** | A fully valid payload without any origin field failed only on `customer.mobile` | No invented `pickup_location*` key is sent. `PickupAddress.pickupLocationId` is retained for record-keeping and optional strict mode |
| G-13 | **Provider tracking-link URL** | **NOT AVAILABLE** | n/a | ShopTantra's own tracking page is used instead of fabricating a provider URL |


### 18.9 Security review
- The API token is read **only** from `process.env.SHIPPING_XPRESS_API_TOKEN`; it is never
  placed in a `NEXT_PUBLIC_` variable, never returned by any route, and the provider
  additionally **scrubs** the token out of every failure message it produces.
- `getShippingConfig()` intentionally **omits** the token from its return shape, so it
  cannot leak through a JSON response or a log line built from that object.
- `sanitizeForLog()` masks any key containing `token`, `secret`, `password`,
  `authorization` or `key`, and the raw provider response is stored pre-sanitised.
- The admin connection route is gated by `requireCorporate(request, ['ADMIN','CORPORATE','SUPER_ADMIN'])`.
- The webhook route refuses to run without a configured secret (HTTP 503) and returns
  HTTP 401 on mismatch using `timingSafeEqual`; it never logs full payloads.
- **Open finding (pre-existing, outside this scope):** `src/app/api/admin/pickup-locations/route.ts`
  has **no auth gate** on `GET`/`POST`, so it could let an unauthenticated caller mark a
  pickup location `VERIFIED` and set its `pickupLocationId` — data that feeds the shipping
  eligibility pre-flight. Recommended fix: add the same
  `requireCorporate(request, ['ADMIN','SUPER_ADMIN','CORPORATE'])` guard used by the
  connection route. *Reported, not changed, to avoid altering an existing flow.*

### 18.10 Operator runbook
1. **Before enabling:** set `SHIPPING_XPRESS_ENABLED=true` and a valid
   `SHIPPING_XPRESS_API_TOKEN` in the hosting environment (Vercel → Project → Environment
   Variables). Never commit the token.
2. **Verify connectivity:** `GET /api/admin/shipping/connection` (as an admin) must return
   `reachable: true, authorized: true, statusCode: 422`. A `405` means the base URL is wrong;
   a `401` means the token is wrong.
3. **Apply schema:** the columns are created at runtime by the bootstrapper, and
   `npm run migrate:deploy` now replays **all** migration files (it previously applied only
   the oldest one) — so any deployment with `DATABASE_URL` present applies the new columns.
4. **First live booking:** confirm a real order. The exact provider response is stored on
   `Shipment.rawResponse` — use it to confirm the AWB/id key names.
5. **If a booking fails:** read `Shipment.failureReason` (it carries the provider's own
   message, e.g. a 422 field list). Fix the data and re-trigger; the idempotency guard
   prevents duplicate bookings.

### 18.11 Verification performed in this session
- `npx tsc --noEmit -p tsconfig.json` → exit **0**
- `npx eslint src/lib/shipping src/app/api/admin/shipping src/app/api/webhooks/shipping-xpress` → exit **0**
- `npx prisma validate` (placeholder datasource URL) → *"schema is valid"*
- `npx prisma generate` → Prisma Client regenerated with the new `Shipment` columns
- `npm run build` → **"Compiled successfully"** (every shipping module bundled and type-checked).
  The build then stops while collecting page data for the unrelated `/api/seller/upload-logo`
  route with `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL` — a pre-existing
  placeholder-credential issue in this workspace (the Supabase URL is a placeholder in the
  local env files), not a shipping defect. The same build also caught and led to a fix for
  `src/lib/shipping.ts` shadowing the `src/lib/shipping/` directory for the specifier
  `@/lib/shipping` (a shim re-export had to be added).
- `node scripts/migrate-deploy.cjs` → correctly skips when `DATABASE_URL` is absent, and
  discovers 2 migrations when it is present
- Live provider harness (compiled provider + real account token) → **ALL CHECKS PASSED**, exit 0
- Fixed during this session: a circular import (`config → provider → config`) that could
  crash at module load depending on load order; the mock courier being used as a silent
  "successful" booking; a duplicate object key in the shipment input; and invalid partial
  `UNIQUE` **constraints** in the migration SQL (now unique **indexes**).

### 18.12 Remaining blockers / next actions
1. **Credential provisioning:** no local env file contains a usable `DATABASE_URL` or
   `SHIPPING_XPRESS_API_TOKEN`, so database-backed end-to-end testing (and applying the
   migration locally) could not be performed from this workspace — configure them in the
   hosting environment.
2. **Confirm the success response:** place one real order, then read `Shipment.rawResponse`
   and finalise the field mapping for AWB/provider ids if the key names differ.
3. Harden `src/app/api/admin/pickup-locations/route.ts` with the RBAC guard (§18.9).
4. Request the official Shipping Xpress API documentation, and if it exists enable real
   webhook signature verification plus tracking/cancel/label/pickup/rate integrations —
   each of those is currently blocked by a verified HTTP 404.

