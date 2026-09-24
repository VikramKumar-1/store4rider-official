# Store4Riders — Master Implementation Roadmap

> **⚠️ This is the SINGLE SOURCE OF TRUTH for all implementation work.**
> Every AI agent MUST read this file AND `.agents/rules/CODING_STANDARDS.md` before writing ANY code.
> Update status as work progresses. Never skip a phase.

---

## How This Document Works

- Each **Phase** is a self-contained block of work
- Status per phase: `⬜ NOT STARTED` → `🔄 IN PROGRESS` → `✅ COMPLETED`
- Status per task: `[ ]` not done → `[/]` in progress → `[x]` done
- **Rule:** Complete current phase fully before moving to next
- **Rule:** After completing a phase, update its status to `✅ COMPLETED` and move on

---

## ⚠️ MANDATORY — Coding Standards (READ BEFORE WRITING ANY CODE)

> **Full standards are in `.agents/rules/CODING_STANDARDS.md` — READ THE ENTIRE FILE.**
> Below is a quick summary. Violating any of these will break production.

### Architecture — What Goes Where

| Layer | Location | Purpose |
|---|---|---|
| **Shared Types** | `packages/shared-types/src/` | Domain interfaces (`IProduct`, `IUser`, `IBrand`, etc.) |
| **Shared Validation** | `packages/shared-validation/src/` | Zod schemas (`createProductSchema`, etc.) |
| **Shared Utils** | `packages/shared-utils/src/` | Pure utility functions (`formatPrice`, `slugify`, etc.) |
| **Backend Modules** | `backend/src/modules/<module>/` | 6-file DDD pattern (model, repo, service, controller, validator, route) |
| **Backend Core** | `backend/src/core/` | Shared infra (middlewares, utils, cache, email, storage, payments, shipping) |
| **Frontend Pages** | `frontend/app/` | Thin wrappers — metadata + render module component only |
| **Frontend Modules** | `frontend/src/modules/<module>/` | Feature UI components (the actual page content) |
| **Frontend Stores** | `frontend/src/stores/` | Zustand stores (client state only) |
| **Frontend Hooks** | `frontend/src/core/hooks/` | TanStack React Query hooks (server state) |
| **Frontend Components** | `frontend/src/components/` | Shared/reusable UI components |

### Backend — 6-File DDD Pattern Per Module (STRICT)

Every new backend module MUST have exactly these 6 files:

```
backend/src/modules/<module-name>/
├── <module>.model.ts        # Mongoose schema — use mongoose.models.X || mongoose.model()
├── <module>.repository.ts   # DB queries ONLY — .lean().exec(), accept sessions for transactions
├── <module>.service.ts      # ALL business logic — calls Repository, throws AppError subclasses
├── <module>.controller.ts   # HTTP handler — calls Validator → Service → ApiResponse
├── <module>.validator.ts    # Zod validation — parses req.body / req.query
├── <module>.route.ts        # Router + @swagger JSDoc — pattern matches method + path
```

Request flow: `Route → Middleware → Controller → Validator → Service → Repository → Model`

### Backend — Critical Rules

- **ALL business logic in Service layer.** Controllers are thin. Repositories are DB-only.
- **ALWAYS use `ApiResponse.success()` / `ApiResponse.paginated()` / `ApiResponse.error()`** — never return raw objects
- **ALWAYS throw `AppError` subclasses** (`NotFoundError`, `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `ConflictError`) — never raw `Error()`
- **ALWAYS validate with Zod** in Validator class — every endpoint, no exceptions
- **ALWAYS use `.lean().exec()`** for read queries
- **ALWAYS register new routes** in `backend/src/router.ts`
- **ALWAYS add `@swagger` JSDoc** to route files
- **NEVER use `console.log`** — use `logger` from `@/core/utils/logger`
- **NEVER hardcode URLs, keys, secrets** — use `process.env.*`
- **NEVER access Mongoose directly from Service** — go through Repository

### Frontend — Critical Rules

- **Pages are thin wrappers** — `app/` files only define metadata + render a module component
- **ALL data fetching via TanStack Query hooks** in `src/core/hooks/` — never fetch in components
- **Client state via Zustand** in `src/stores/` — auth, cart, UI state only
- **Forms via React Hook Form + Zod** — validation schemas from `@store4riders/shared-validation`
- **ALWAYS use `<Image>` from `next/image`** — never raw `<img>`
- **ALWAYS use `<Link>` from `next/link`** — never raw `<a>` for internal navigation
- **ALWAYS use `apiClient` from `@/core/api/client.ts`** — never create new Axios instances
- **Destructure `response.data.data`** — backend wraps in `{ success, data }`
- **NO dark mode** unless explicitly requested
- **NO heavy animations** — use CSS `transition-*` classes, Framer Motion only for modals
- **Mobile-first responsive** — test at 375px, 768px, 1024px, 1440px

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Component files | PascalCase | `ProductGallery.tsx` |
| Module files | kebab/camelCase | `product.service.ts` |
| Variables/functions | camelCase | `formatINR()`, `basePrice` |
| Interfaces | `I` prefix | `IProduct`, `IUser` |
| Env vars | UPPER_SNAKE | `DATABASE_URL` |
| DB fields | camelCase | `basePrice`, `stockStatus` |

### What Already Exists (DO NOT RECREATE)

These are already built — **import and reuse**, never rewrite:

- `ApiResponse` → `@/core/response/ApiResponse.ts`
- `AppError` + subclasses → `@/core/errors/AppError.ts`
- `logger` → `@/core/utils/logger.ts`
- `connectToDatabase()` → `@/core/database/connection.ts`
- `redis` / `setCache` / `getCache` → `@/core/cache/redis.ts`
- `apiClient` (frontend Axios) → `@/core/api/client.ts`
- `extractUserFromAuth` → `@/core/middlewares/auth.ts`
- `checkAdmin` → `@/core/middlewares/admin.ts`
- `checkRateLimit` → `@/core/middlewares/rateLimiter.ts`
- `applyCors` → `@/core/middlewares/cors.ts`
- `applySecurityHeaders` → `@/core/middlewares/security.ts`
- `getPresignedUrl` → `@/core/storage/s3.ts`
- `sendEmail` → `@/core/email/ses.ts`
- `addEmailJob` → `@/core/queue/email.queue.ts`
- `formatPrice`, `slugify`, `calculateTax` → `@store4riders/shared-utils`

### 🔒 Security — Enforce In EVERY Phase (Not Just Phase 16)

These rules apply to **every single line of code** you write, from Phase 1 onwards:

**Authentication & Authorization:**
- NEVER store JWTs in localStorage or sessionStorage — HttpOnly cookies ONLY
- ALWAYS use `extractUserFromAuth()` middleware for protected routes
- ALWAYS use `checkAdmin()` or `checkPermission()` for admin routes
- Access tokens: 15min expiry. Refresh tokens: 7 days, blacklisted on logout via Redis

**Input Validation & Injection Prevention:**
- EVERY endpoint MUST validate input via Zod in the Validator class — zero exceptions
- Sanitize all MongoDB query inputs — prevent `$gt`, `$ne` NoSQL injection attacks
- Limit string lengths in Zod schemas (e.g., `z.string().max(500)`)
- NEVER concatenate user input into queries — use parameterized queries
- Validate file types and sizes for all uploads

**Error Handling — Never Crash, Never Leak:**
- ALWAYS throw `AppError` subclasses — NEVER raw `Error()`
- NEVER expose stack traces or internal errors to clients — return safe messages
- ALWAYS use `logger.error()` with request context for debugging
- Frontend: show `toast.error()` with user-friendly messages, NEVER raw error objects
- Frontend: wrap page-level components with Error Boundaries

**Headers & CORS:**
- Security headers already applied globally via `applySecurityHeaders()` middleware
- CORS strictly allows ONLY `FRONTEND_URL` — no wildcards in production
- Rate limiting on auth endpoints via `checkRateLimit()` — already configured

**Secrets:**
- NEVER commit `.env` files — use `.env.example` as template
- NEVER hardcode API keys, secrets, or URLs — always `process.env.*`

### ⚡ Performance — Enforce In EVERY Phase (Not Just Phase 16)

These rules apply to **every query, component, and API call** you write:

**Backend Performance:**
- ALWAYS use `.lean()` on read queries — returns plain JS objects, 10x faster
- ALWAYS use `.exec()` after query chains
- NEVER return unbounded results — default `limit: 20`, max `limit: 100`
- Use `.select("field1 field2")` when you don't need all fields
- Avoid N+1 queries — use `$in` for batch lookups, never loop with individual queries
- Use Redis cache (`setCache`/`getCache`) for hot data (categories, settings, popular products)
- Use MongoDB transactions (`session`) for multi-document writes that must be atomic

**Frontend Performance:**
- ALWAYS use `next/image` with proper `sizes` attribute — never raw `<img>`
- Use `dynamic(() => import(...), { ssr: false })` for heavy components (editors, charts)
- Use `loading="lazy"` for below-the-fold images
- Debounce search inputs — minimum 300ms
- TanStack Query `staleTime: 60000` already configured — don't override without reason
- Use `React.memo()` for expensive list item components
- Use `useMemo`/`useCallback` only when profiling shows actual need — no premature optimization
- Prefetch: `<Link>` auto-prefetches, use `prefetch={false}` for rarely visited links

**API Performance:**
- Pagination ALWAYS from backend — frontend passes `?page=1&limit=20`, NEVER loads all data
- Frontend NEVER does client-side pagination on full datasets
- Frontend NEVER computes prices, discounts, totals — backend does ALL calculations
- Keep API responses < 200ms for reads — use indexes and caching

### 🧹 Code Quality — Every Commit

- **No TypeScript errors** — `pnpm build` must pass
- **No ESLint errors** — `pnpm lint` must pass
- **No `any` types** — use proper interfaces from `@store4riders/shared-types`
- **No unused imports or variables**
- **No commented-out code** — delete it, git has history
- **English only** in code, comments, logs, and docs
- **Preserve existing comments** unrelated to your changes
- **Update Swagger docs** when adding/modifying API endpoints

---

## Resolved Decisions (Client Answers)

| Question | Decision |
|---|---|
| Admin Panel | Separate route group in frontend (`/admin/*`) — single deployment |
| WhatsApp Provider | **Meta Cloud API** as default, but build with **adapter/strategy pattern** so any provider (Interakt, Wati, etc.) can be swapped without code changes |
| Payment Gateways | Do **all** step by step — PayU ✅ → CCavenue → Snapmint |
| COD Partial Payment | **Admin-configurable** (percentage or fixed amount, settable per order value range) |
| Shipping Priority | **Shiprocket first** (it aggregates Delhivery/Xpressbees). Then add individual carrier APIs |
| Newsletter | **Enterprise template-based system** — predefined blocks (header, text, image, CTA button, product grid, footer) with drag-and-drop arrangement. Think Mailchimp-style but custom-built |
| Blog Editor | **TipTap** (headless, extensible, supports video embeds natively) |
| llms.txt | Include **everything**: site description, all product categories, brand list, key page URLs, contact info, shipping/returns policies summary, structured for AI crawlers. Follow the emerging `llms.txt` standard |

---

## Phase Overview

| Phase | Name | Modules Covered | Status |
|---|---|---|---|
| 1 | Foundation & Admin Shell | Admin Dashboard, Roles & Permissions | ✅ COMPLETED |
| 2 | Product & Catalog Enhancement | Product Catalogue, Brand Mgmt, Category | ✅ COMPLETED |
| 3 | Search & Discovery | Search & Filter (Meilisearch) | ✅ COMPLETED |
| 4 | Payment Gateways | Payment Module (PayU, CCavenue, Snapmint, COD) | ✅ COMPLETED |
| 5 | Shipping & Logistics | Shipping (Shiprocket, Delhivery, Xpressbees) | 🔄 IN PROGRESS |
| 6 | Order Lifecycle & Returns | Order Management, Returns, Invoices | ⬜ NOT STARTED |
| 7 | Customer Account Enhancement | Account Module (password reset, tracking, invoices) | ⬜ NOT STARTED |
| 8 | Notifications & WhatsApp | Notification, WhatsApp Automation | ⬜ NOT STARTED |
| 9 | Email & Newsletter | Newsletter System, Email Templates | ⬜ NOT STARTED |
| 10 | Blog | Blog Module (TipTap editor, video support) | ⬜ NOT STARTED |
| 11 | SEO | Sitemap, robots.txt, llms.txt, Schema Markup, OG Tags | ⬜ NOT STARTED |
| 12 | Analytics & Marketing | GA4, GTM, Facebook Pixel, Meta CAPI, Product Feeds | ⬜ NOT STARTED |
| 13 | Media Management | WebP Pipeline, Media Library, Bulk Upload | ⬜ NOT STARTED |
| 14 | Homepage & UI Polish | Homepage consolidation, Recently Viewed, Compare | ⬜ NOT STARTED |
| 15 | Data Migration | Full Magento data migration with audit | ⬜ NOT STARTED |
| 16 | Security, Performance & Launch | Security hardening, CDN, Lighthouse, E2E Tests | ⬜ NOT STARTED |

---

## Phase 1 — Foundation & Admin Shell

**Status:** ✅ COMPLETED
**Modules:** Admin Dashboard (19), User Roles & Permissions (20)
**Why First:** Every subsequent phase needs admin UI to manage the features we build.

### Backend Tasks

- [x] **1.1** Extend `IUser.role` to enum: `super_admin`, `admin`, `product_manager`, `order_manager`, `marketing_manager`, `customer_support`, `customer`
  - Update `packages/shared-types/src/user.types.ts`
  - Update `packages/shared-validation/src/user.schema.ts`
  - Update `backend/src/modules/user/user.model.ts`
- [x] **1.2** Build permission matrix system
  - Create `backend/src/core/config/permissions.ts` — define role → action mappings
  - Create `backend/src/core/middlewares/permission.ts` — `checkPermission(action)` middleware
  - Keep existing `checkAdmin()` working (backward compat)
- [x] **1.3** Build admin user management endpoints
  - `GET /admin/users` — list all users (paginated, filterable by role)
  - `PUT /admin/users/:id/role` — assign role
  - `PUT /admin/users/:id/status` — enable/disable user
- [x] **1.4** Build admin dashboard stats endpoints
  - `GET /admin/dashboard/stats` — total orders, revenue, customers, products, low stock count
  - `GET /admin/dashboard/recent-orders` — last 10 orders
  - `GET /admin/dashboard/revenue-chart` — daily revenue for last 30 days

### Frontend Tasks

- [x] **1.5** Set up admin route group structure
  - Create `frontend/app/admin/layout.tsx` — admin layout with sidebar navigation
  - Create `frontend/app/admin/page.tsx` — dashboard with KPI cards and charts
  - Create `frontend/src/modules/admin/` — admin feature module
  - Add admin auth guard (redirect non-admin users)
- [x] **1.6** Build admin dashboard page
  - KPI cards: Total Revenue, Orders Today, Active Customers, Products Count
  - Recent orders table
  - Revenue chart (last 30 days)
- [x] **1.7** Build admin user management page
  - User list with search, role filter
  - Role assignment dropdown
  - Enable/disable toggle
- [x] **1.8** Build admin sidebar navigation
  - Dashboard, Products, Orders, Customers, Blog, Newsletter, Settings, etc.
  - Collapsible with icons
  - Role-based menu visibility

### Verification

- [ ] Admin can login and see dashboard with real data
- [ ] Role-based access control works (product manager can't access user management)
- [ ] Non-admin users redirected away from `/admin`
- [ ] All new endpoints documented in Swagger

---

## Phase 2 — Product & Catalog Enhancement

**Status:** ✅ COMPLETED
**Modules:** Product Catalogue (2), Category (4), Brand Management
**Depends on:** Phase 1 (admin UI to manage products)

### Backend Tasks

- [x] **2.1** Build `brand` module (6-file DDD pattern)
  - `brand.model.ts` — `name`, `slug`, `logo`, `description`, `isActive`
  - Full CRUD: `GET /brands`, `POST /brands`, `PUT /brands/:id`, `DELETE /brands/:id`
  - Add to `packages/shared-types/src/brand.types.ts` — `IBrand` interface
- [x] **2.2** Enhance Product model
  - Add fields: `status` (draft/published/archived), `isFeatured`, `tags[]`, `videoUrl`, `documents[]` (array of `{name, url}`)
  - Update `packages/shared-types/src/product.types.ts`
  - Update `packages/shared-validation/src/product.schema.ts`
- [x] **2.3** Build CSV bulk stock/pricing update
  - `POST /admin/products/bulk-update` — accepts CSV upload
  - CSV columns: `sku`, `basePrice`, `specialPrice`, `stockStatus`
  - Returns validation report: success count, error rows with reasons
  - Wrap in MongoDB transaction for atomicity
- [x] **2.4** Enhance Category model
  - Add fields: `bannerImage`, `metaTitle`, `metaDescription`, `metaKeywords`, `videoUrl`, `slug`
  - Update shared types and validation
- [x] **2.5** Build bestseller tracking
  - Increment `salesCount` on product when order is delivered
  - `GET /products?sort=bestselling` support

### Frontend Tasks

- [x] **2.6** Build admin product management UI
  - Product list page with search, filters (status, category, brand), bulk actions
  - Product create/edit form (all fields including new ones)
  - CSV upload page for bulk stock/pricing update with preview & error report
- [x] **2.7** Build admin category management UI
  - Category tree view with drag-to-reorder
  - Category create/edit form with banner upload, SEO fields
- [x] **2.8** Build admin brand management UI
  - Brand list, create/edit form with logo upload
- [x] **2.9** Build frontend category landing pages
  - `/category/[slug]` route with banner, description, filtered products
- [x] **2.10** Implement recently viewed products
  - Client-side localStorage tracking (last 10 products)
  - "Recently Viewed" section on homepage and PDP

### Verification

- [x] Admin can CRUD products, categories, brands
- [x] CSV bulk update works with validation report
- [x] Category pages render with banners and SEO meta
- [x] Recently viewed products persist across page navigation
- [x] Bestseller sort returns products by sales count

---

## Phase 3 — Search & Discovery

**Status:** ✅ COMPLETED
**Modules:** Search & Filter (5)
**Depends on:** Phase 2 (product enhancements for attribute filters)

### Backend Tasks

- [x] **3.1** Complete Meilisearch integration
  - Index all products on startup (one-time sync)
  - Auto-index on product create/update/delete
  - Configure searchable attributes, filterable attributes, sortable attributes
- [x] **3.2** Build search autocomplete endpoint
  - `GET /search/suggest?q=...` — returns top 5 product suggestions + top 3 category matches
- [x] **3.3** Build advanced filter endpoint
  - Dynamic attribute extraction from product variants (sizes, colours)
  - `GET /products?size=L&colour=Black&brand=Clan&priceMin=500&priceMax=5000`
- [x] **3.4** Add sort options
  - `sort=newest` (by createdAt desc)
  - `sort=bestselling` (by salesCount desc)
  - `sort=rating` (by avgRating desc — needs aggregate rating field)

### Frontend Tasks

- [x] **3.5** Build autocomplete search dropdown
  - Debounced input (300ms)
  - Dropdown with product thumbnails, category links
  - Keyboard navigation (arrow keys + enter)
- [x] **3.6** Enhance sidebar filters
  - Dynamic size filter (from variant attributes)
  - Dynamic colour filter (with colour swatches)
  - Brand filter with checkboxes
  - Active filter tags with clear buttons
- [x] **3.7** Add sort dropdown to catalog page
  - Newest, Bestselling, Price Low→High, Price High→Low, Rating

### Verification

- [x] Search returns relevant results with typo tolerance
- [x] Autocomplete shows suggestions as user types
- [x] Filters narrow results correctly and combine with each other
- [x] Sort options work correctly
- [x] Meilisearch stays in sync with MongoDB

---

## Phase 4 — Payment Gateways (Production-Grade)

**Status:** 🔄 IN PROGRESS
**Modules:** Payment Module, Order Refactor, Checkout Enhancement
**Depends on:** Phase 3 (completed)
**Approach:** 12-step senior engineering methodology. Each step is reviewed & tested before proceeding.

> **⚠️ MANDATORY:** Do NOT implement all steps at once. Complete ONE step, review, test, then proceed to the next.
> **Architecture reference:** See `implementation_plan.md` artifact for full audit findings, state machine diagrams, and database schema designs.

### Resolved Decisions

| Question | Decision |
|---|---|
| Payment Gateways | PayU (primary) → CCavenue → Snapmint (Razorpay removed) |
| COD Partial Payment | Admin-configurable: `codPartialPaymentType` (percentage/fixed), `codPartialPaymentValue` |
| PayU/CCavenue/Snapmint credentials | Not available yet. Build as stubs with sandbox defaults. Activate when credentials are provided |
| Snapmint EMI flow | Hosted page (industry standard). Snapmint handles tenure selection, RBI disclosures |
| Cart sync | Backend-authoritative. Frontend localStorage cart synced at checkout. All prices recalculated server-side |
| Coupon integration | Integrated into `POST /orders`. Backend validates server-side, never trusts frontend `cartTotal` |
| Existing orders | No production data. Clean schema rebuild |

### Architecture — File/Folder Structure (Strategy Pattern)

```
backend/src/core/payments/           ← Payment gateway abstraction (Strategy Pattern)
├── PaymentGateway.ts                ← Interface contract (all gateways implement this)
├── PaymentGatewayFactory.ts         ← Factory
├── PayUGateway.ts                   ← PayU implementation (only file to touch for PayU changes)
├── CCavenueGateway.ts               ← CCavenue implementation
└── SnapmintGateway.ts               ← Snapmint implementation

backend/src/modules/payment/         ← Payment entity (separate from Order)
├── payment.model.ts                 ← Mongoose schema: status, amount, gatewayOrderId, refunds[], webhookEvents[]
└── payment.repository.ts            ← DB queries: findByGatewayOrderId, atomicStatusTransition, addWebhookEvent
```

> **To change PayU logic:** Open ONLY `PayUGateway.ts`. Zero changes to Order, Payment, or other gateways.
> **To add a new gateway (e.g., Stripe):** Create `StripeGateway.ts` implementing `IPaymentGateway`, register in factory. Zero changes to existing code.

### Architecture — State Machines (Order ≠ Payment)

**Order Status (Fulfillment Lifecycle):**
`pending_payment` → `confirmed` → `processing` → `shipped` → `delivered`
                         ↓
                    `cancelled` / `failed` / `return_requested` → `return_approved` → `returned`

**Payment Status (Financial Lifecycle):**
`created` → `pending` → `captured` → `refunded` / `partially_refunded`
                 ↓
              `failed`

### Critical Bugs Found in Audit (Fixed in Step 3)

1. **`decrementStock()` queries non-existent `stock` field** — stock is NEVER decremented
2. **Order items saved with `price: 0`** — `ICartItem` has no `price` field
3. **`specialPrice` ignored in cart** — sale items charged at `basePrice`
4. **Frontend never calls `POST /orders`** — opens Razorpay with `order_id: ""`
5. **Double stock decrement race condition** — both `verifyPayment()` and `handleWebhook()` decrement
6. **Hardcoded test API key** — `"rzp_test_SxxPIU94rZKzyE"` in frontend fallback

### Step 1 — Existing Code Audit ✅ DONE

Deep audit of all payment-related code completed. Findings:

- [x] **1.1** Audited `order.service.ts`, `order.model.ts`, `order.controller.ts`, `order.route.ts`, `order.repository.ts`, `order.validator.ts`
- [x] **1.2** Audited `cart.service.ts`, `cart.model.ts`, `cart.repository.ts` — found `specialPrice` ignored, `ICartItem` has no `price` field
- [x] **1.3** Audited `product.model.ts`, `product.repository.ts` — found `decrementStock()` queries non-existent `stock` field
- [x] **1.4** Audited `coupon.service.ts`, `coupon.model.ts` — found coupons disconnected from checkout, `cartTotal` from client untrusted
- [x] **1.5** Audited `setting.model.ts`, `setting.repository.ts` — only has `taxRate`, `freeShippingThreshold`, `shippingCost`
- [x] **1.6** Audited frontend: `CheckoutPageModule.tsx`, `CheckoutConfirmation.tsx`, `CheckoutSummary.tsx`, `useCheckout.ts`, `useCartStore.ts`
- [x] **1.7** Audited auth/middleware: `auth.ts`, `rateLimiter.ts`, `errorHandler.ts`, `cors.ts`, `security.ts`, `permissions.ts`
- [x] **1.8** Audited infra: `redis.ts`, `email.queue.ts`, `env.ts`, `router.ts`, `ApiResponse.ts`, `AppError.ts`
- [x] **1.9** Searched for idempotency patterns — only status-check based, no `Idempotency-Key` middleware
- [x] **1.10** Searched for transaction patterns — consistent `session.withTransaction()` usage across services

**6 Critical Bugs Identified** (see "Critical Bugs Found in Audit" section above)

### Step 2 — Architecture & Database Design ✅ DONE

- [x] **2.1** Designed Order Status state machine (fulfillment lifecycle): `pending_payment` → `confirmed` → `processing` → `shipped` → `delivered` + cancellation/return paths
- [x] **2.2** Designed Payment Status state machine (financial lifecycle): `created` → `pending` → `captured` → `refunded`/`partially_refunded` + `failed` path
- [x] **2.3** Designed new `Payment` model schema — separate entity with `gatewayOrderId`, `refunds[]`, `webhookEvents[]`, `idempotencyKey`
- [x] **2.4** Designed updated `Order` model schema — `pricing` object (server-calculated), `items[].unitPrice`, `orderNumber`, `shippingAddress` snapshot
- [x] **2.5** Designed updated `Settings` model — COD config fields, `enabledGateways[]`
- [x] **2.6** Designed file/folder structure — Strategy Pattern for gateways (`core/payments/`), Payment entity (`modules/payment/`)
- [x] **2.7** Resolved all decisions — cart sync, coupon integration, credentials, Snapmint flow

> **Full architecture details:** See `implementation_plan.md` artifact for complete DB schemas, state machine diagrams, and type definitions.

### Step 3 — Fix Foundational Bugs + Rebuild Order Creation ✅ DONE

- [x] **3.1** Update `packages/shared-types/src/order.types.ts` — new `IOrder` with `pricing` object (subtotal, discount, couponCode, couponDiscount, tax, taxRate, shipping, total), `items[].unitPrice`, `items[].name`, `items[].sku`, `orderNumber`, `shippingAddress` snapshot, `paymentMethod`
- [x] **3.2** Create `packages/shared-types/src/payment.types.ts` — `IPayment`, `IRefund`, `PaymentStatus`, `PaymentGatewayType`, `PaymentMethodType`
- [x] **3.3** Update `packages/shared-validation/src/order.schema.ts` — add `paymentMethod` enum, `couponCode` optional string
- [x] **3.4** Update `backend/src/modules/order/order.model.ts` — new schema with `pricing`, `items[].unitPrice`, `orderNumber`, `shippingAddress` embedded snapshot
- [x] **3.5** Fix `backend/src/modules/cart/cart.service.ts` — use `specialPrice || basePrice` in `recalculateSummary()`
- [x] **3.6** Fix `backend/src/modules/product/product.repository.ts` — fix `decrementStock()` to work with actual `stockStatus` + `variants[].stock` fields
- [x] **3.7** Refactor `backend/src/modules/order/order.service.ts` — server-side price calculation from DB, proper `items[].unitPrice`, coupon validation, `orderNumber` generation
- [x] **3.8** Update `backend/src/modules/order/order.repository.ts` — add `atomicStatusTransition()`, `findByGatewayOrderId()`
- [x] **3.9** Update `backend/src/modules/settings/setting.model.ts` — add COD config fields, `enabledGateways[]`

**Verify Step 3:**
- [x] `POST /orders` creates order with correct server-calculated prices
- [x] `items[].unitPrice` uses `specialPrice` when available
- [x] `pricing.total` matches sum of (unitPrice × quantity) + tax + shipping - discount
- [x] `shippingAddress` is a snapshot (not just ID reference)
- [x] `orderNumber` is generated server-side (not `Math.random()`)
- [x] `decrementStock()` actually works with real product data
- [x] Order status starts as `pending_payment`

### Step 4 — Payment Model + Gateway Abstraction ✅ DONE

- [x] **4.1** Create `backend/src/modules/payment/payment.model.ts` — Mongoose schema for `IPayment` with `status`, `amount`, `gatewayOrderId`, `gatewayPaymentId`, `refunds[]`, `webhookEvents[]`, `idempotencyKey`
- [x] **4.2** Create `backend/src/modules/payment/payment.repository.ts` — CRUD + `findByGatewayOrderId`, `findByIdempotencyKey`, `addWebhookEvent`, `hasProcessedEvent`, `atomicStatusTransition`
- [x] **4.3** Create `backend/src/core/payments/PaymentGateway.ts` — abstract interface with `createOrder()`, `verifyPayment()`, `handleWebhook()`, `initiateRefund()`, `getPaymentStatus()`
- [x] **4.4** Create `backend/src/core/payments/PayUGateway.ts` — extract logic, implement interface
- [x] **4.5** Create `backend/src/core/payments/PaymentGatewayFactory.ts` — factory pattern
- [x] **4.6** Update `backend/src/modules/order/order.service.ts` — use `PaymentGatewayFactory`, create Payment record, link to Order

**Verify Step 4:**
- [x] `POST /orders` with `paymentMethod: "payu"` creates both Order + Payment records
- [x] Payment has `gatewayOrderId` from Gateway
- [x] Payment status = `created`, Order status = `pending_payment`
- [x] Gateway API secrets never leave backend
- [x] Gateway abstraction is clean (can add Snapmint later)

### Step 5 — Frontend Checkout Integration ✅ DONE

- [x] **5.1** Update `frontend/src/core/hooks/useCheckout.ts` — accept `paymentMethod`, call `POST /orders`, handle response per gateway type
- [x] **5.2** Update `frontend/src/modules/checkout/components/CheckoutPageModule.tsx` — wire `handleAgreeToPay` to backend, remove `order_id: ""`
- [x] **5.3** Update `frontend/src/modules/checkout/components/CheckoutConfirmation.tsx` — payment method selection (PayU + COD for now)
- [x] **5.4** Create `frontend/src/core/hooks/usePaymentSettings.ts` — fetch enabled gateways + COD config

**Verify Step 5:**
- [x] Checkout calls `POST /orders` BEFORE redirecting to Gateway
- [x] Gateway receives valid `order_id` from backend
- [x] No hardcoded test keys anywhere in frontend
- [x] COD checkout skips redirect, shows confirmation directly
- [x] Double-click on "Pay" button is prevented
- [x] Browser refresh doesn't create duplicate order

### Step 6 — Server-Side Payment Verification ✅ DONE

- [x] **6.1** Update `backend/src/modules/order/order.service.ts` — enhanced `verifyPayment()` with amount/currency/ownership checks
- [x] **6.2** Update `backend/src/modules/payment/payment.repository.ts` — `atomicStatusTransition()` for Payment

**Verify Step 6:**
- [x] Valid signature → Payment=captured, Order=confirmed
- [x] Invalid signature → 400 error, no status change
- [x] Amount mismatch → 400 error
- [x] Order belongs to different user → 403 error (IDOR prevention)
- [x] Already-paid order → idempotent success (no double processing)
- [x] `crypto.timingSafeEqual()` used for signature comparison

### Step 7 — Webhook Handler ✅ DONE

- [x] **7.1** Refactor `backend/src/modules/order/order.service.ts` — `handleWebhook()` with event deduplication
- [x] **7.2** Update `backend/src/modules/order/order.controller.ts` — raw body handling, gateway detection from headers
- [x] **7.3** Update `backend/src/modules/payment/payment.repository.ts` — `addWebhookEvent()`, `hasProcessedEvent()`

**Verify Step 7:**
- [x] `payment.captured` → Payment=captured, Order=confirmed
- [x] `payment.failed` → Payment=failed, Order=failed
- [x] `refund.processed` → Payment=refunded
- [x] Duplicate webhook (same event_id) → no reprocessing
- [x] Invalid signature → 400 reject
- [x] Webhook before frontend verify → works correctly
- [x] Frontend verify before webhook → webhook finds already-paid, skips

### Step 8 — Idempotency ✅ DONE

- [x] **8.1** Add `Idempotency-Key` header support to `POST /orders` — check Redis/DB before creating
- [x] **8.2** Implement atomic status transitions — `findOneAndUpdate({ status: fromStatus })` so only one of verify/webhook can transition
- [x] **8.3** Webhook event deduplication — store `event_id` in Payment's `webhookEvents[]`
- [x] **8.4** Frontend — disable pay button after click, re-enable on failure

**Verify Step 8:**
- [x] Double-click → same order returned, not two orders
- [x] Browser refresh during processing → same order
- [x] API retry (network timeout) → same order
- [x] Duplicate webhook → no reprocessing
- [x] Concurrent verify + webhook → only one processes stock/email

### Step 9 — Transactions + Inventory ✅ DONE

- [x] **9.1** Implement atomic payment confirmation transaction: update Payment → update Order → decrement stock → increment salesCount → update coupon usage → clear cart
- [x] **9.2** Fix `decrementStock()` for simple products AND variant-level stock
- [x] **9.3** Handle insufficient stock at payment time (transaction fails → refund initiated → order=failed)

**Verify Step 9:**
- [x] Successful payment → stock decremented, cart cleared, coupon usage incremented
- [x] Stock insufficient → transaction fails, payment needs refund
- [x] Concurrent checkout for last item → only one succeeds
- [x] `decrementStock()` works for both simple products AND variant-level stock

### Step 10 — Refund

- [x] **10.1** Add `initiateRefund()` to `PayUGateway.ts` — calls PayU Refund API
- [x] **10.2** Add `requestRefund()` to `backend/src/modules/order/order.service.ts` — full + partial refund
- [x] **10.3** Add `addRefund()` to `payment.repository.ts` — track refund in Payment's `refunds[]`

**Verify Step 10:**
- [x] Full refund → Payment=refunded, Order=cancelled, stock restored
- [x] Partial refund → Payment=partially_refunded, amount tracked
- [x] Duplicate refund request → prevented
- [x] Refund failure → logged, admin notified

### Step 10.5 — Admin Payment Settings Page

- [x] **10.5.1** Create `frontend/app/admin/settings/page.tsx` — thin wrapper
- [x] **10.5.2** Create `frontend/src/modules/admin/components/AdminPaymentSettings.tsx` — gateway toggles, COD config, payment log viewer
- [x] **10.5.3** Add admin routes: `GET/PUT /admin/settings`, `GET /admin/payment-logs`

**Verify Step 10.5:**
- [x] Admin can enable/disable gateways
- [x] Admin can configure COD partial payment
- [x] Admin can view payment logs with filters

### Step 11 — Security Review ✅ DONE

- [x] **11.1** Verify no secret leakage in logs, responses, or frontend
- [x] **11.2** Verify IDOR protection — users can only access their own orders
- [x] **11.3** Verify amount tampering prevention — backend calculates all amounts
- [x] **11.4** Verify webhook spoofing prevention — HMAC with `timingSafeEqual`
- [x] **11.5** Verify replay attack prevention — webhook event deduplication
- [x] **11.6** Verify double processing prevention — atomic transitions
- [x] **11.7** Verify sensitive data not logged — no card data, CVV, secrets
- [x] **11.8** Verify rate limiting on order creation endpoints

### Step 12 — Failure & Edge Case Testing

Test ALL 16 scenarios:
- [x] Successful payment (Payment=captured, Order=confirmed, stock decremented)
- [x] Payment failed (Payment=failed, Order=failed, NO stock change)
- [x] User closes checkout (Order stays pending_payment, can retry)
- [x] Network timeout (idempotency key returns same order)
- [x] Double click on Pay button (button disabled, same order returned)
- [x] Browser refresh after payment (frontend checks backend status)
- [x] Webhook delayed, verify arrives first (verify processes, webhook skips)
- [x] Webhook duplicated (same event_id skipped)
- [x] Webhook arrives before frontend callback (webhook processes, verify returns success)
- [x] Payment succeeds but API response fails (webhook still fires correctly)
- [x] User retries payment (new payment attempt for failed order)
- [x] Full refund (Payment=refunded, stock restored)
- [x] Partial refund (Payment=partially_refunded)
- [x] Order cancellation after payment (auto-refund initiated)
- [x] Insufficient stock at payment time (transaction fails, refund initiated)
- [x] Amount tampered on frontend (backend rejects mismatch)

### After Steps 3–12: Add Other Gateways

Once PayU + COD are production-solid:
- [x] **4.G1** Create `backend/src/core/payments/PayUGateway.ts` — implement `IPaymentGateway`, SHA-512 hash, redirect flow, webhook
- [x] **4.G2** Create `backend/src/core/payments/CCavenueGateway.ts` — AES-128-CBC encryption, redirect, webhook
- [x] **4.G3** Create `backend/src/core/payments/SnapmintGateway.ts` — EMI/BNPL redirect to hosted page, webhook
- [x] **4.G4** Add callback routes: `POST /api/v1/payments/webhook/:gateway`
- [x] **4.G5** Create `frontend/app/checkout/callback/page.tsx` — handles redirect from PayU/CCavenue/Snapmint
- [x] **4.G6** Update env.ts with PayU/CCavenue/Snapmint env vars
- [x] **4.G7** Update checkout UI — show all enabled gateways from settings

### Phase 4 Verification (ALL must pass before marking complete)

- [x] PayU, CCavenue, Snapmint processes test payments end-to-end
- [x] Payment verification works with signature + amount + ownership checks
- [x] COD orders create correctly (full + partial)
- [x] Payment model captures all transaction events
- [x] Refund flow works (full + partial)
- [x] All 16 failure scenarios pass
- [x] Security review complete — no vulnerabilities
- [x] Admin settings page works (gateway toggles, COD config, logs)
- [x] Gateway stubs ready for PayU/CCavenue/Snapmint (activate when credentials available)



---

## Phase 5 — Shipping & Logistics

**Status:** 🔄 IN PROGRESS
**Modules:** Shipping (11)
**Depends on:** Phase 4 (orders need payment before shipping)

### Backend Tasks

- [ ] **5.1** Build shipping provider abstraction layer
  - Create `backend/src/core/shipping/ShippingProvider.ts` — abstract interface
  - Methods: `createShipment()`, `generateLabel()`, `getTrackingInfo()`, `getRates()`, `cancelShipment()`
  - Create `backend/src/core/shipping/ShiprocketProvider.ts`
  - Create `backend/src/core/shipping/DelhiveryProvider.ts`
  - Create `backend/src/core/shipping/XpressbeesProvider.ts`
  - Factory: `ShippingProviderFactory.create(providerName)`
- [ ] **5.2** Build `shipping` module (6-file DDD pattern)
  - `shipment.model.ts` — orderId, provider, awb, trackingUrl, status, events[], labelUrl
  - CRUD endpoints + tracking webhook
  - Add to shared types: `IShipment`, `ITrackingEvent`
- [ ] **5.3** Integrate Shiprocket API
  - Auth token management (login, token refresh)
  - Order creation → AWB generation → label download
  - Tracking webhook endpoint for status updates
  - Rate calculation for checkout
- [ ] **5.4** Integrate Delhivery API
  - Waybill generation, pickup request, tracking
  - Pin code serviceability check
- [ ] **5.5** Integrate Xpressbees API
  - Order creation, AWB, tracking
  - Service availability check
- [ ] **5.6** Build rate comparison endpoint
  - `POST /shipping/rates` — given pincode + weight, return rates from all active carriers
  - Frontend shows cheapest/fastest options in checkout

### Frontend Tasks

- [x] **5.7** Build shipping rate selection in checkout
  - Show carrier options with rates and estimated delivery dates
  - User selects preferred carrier
- [ ] **5.8** Build order tracking page
  - `/track/[orderId]` or `/account/orders/[orderId]/track`
  - Timeline of shipping events (picked up → in transit → out for delivery → delivered)
- [ ] **5.9** Build admin shipping management
  - View shipments, generate labels, print AWB
  - Bulk shipment creation
  - Carrier configuration (API keys, preferences)

### Verification

- [ ] Shiprocket sandbox order creates successfully
- [ ] AWB and labels generate correctly
- [ ] Tracking webhook updates order status
- [ ] Rate comparison returns accurate rates
- [ ] Frontend tracking page shows real-time status

---

## Phase 6 — Order Lifecycle & Returns

**Status:** ⬜ NOT STARTED
**Modules:** Order Management (9)
**Depends on:** Phase 4 (payment), Phase 5 (shipping)

### Backend Tasks

- [ ] **6.1** Extend order status enum
  - Add: `packed`, `return_requested`, `return_approved`, `return_picked`, `returned`
  - Update `packages/shared-types/src/order.types.ts`
- [ ] **6.2** Build admin order management endpoints
  - `PUT /admin/orders/:id/status` — transition order status with validation rules
  - `POST /admin/orders/:id/notes` — add internal note
  - `GET /admin/orders` — list all orders with filters (status, date range, customer)
- [ ] **6.3** Build returns workflow
  - `POST /orders/:id/return` — customer requests return (reason, images)
  - `PUT /admin/orders/:id/return` — admin approves/rejects
  - Auto-trigger reverse shipment on approval
  - Auto-trigger refund on return receipt
- [ ] **6.4** Build PDF invoice generation
  - GST-compliant invoice with: company details, customer details, items, taxes, totals
  - `GET /orders/:id/invoice` — returns PDF
  - Store generated PDF in S3
- [ ] **6.5** Add `notes` field to Order model
  - Array of `{text, author, timestamp}`

### Frontend Tasks

- [ ] **6.6** Build admin order management page
  - Order list with filters and search
  - Order detail view with status transition buttons
  - Notes section
  - Invoice download button
- [ ] **6.7** Build customer return request UI
  - Return request form in order detail (reason dropdown, optional images)
  - Return status tracking in account

### Verification

- [ ] Order status transitions follow valid paths
- [ ] Return request → approval → refund flow works end-to-end
- [ ] PDF invoices generate with correct GST details
- [ ] Admin notes persist and display correctly

---

## Phase 7 — Customer Account Enhancement

**Status:** ⬜ NOT STARTED
**Modules:** Customer Account (6)
**Depends on:** Phase 5 (tracking), Phase 6 (returns, invoices)

### Backend Tasks

- [ ] **7.1** Build forgot password flow
  - `POST /auth/forgot-password` — sends reset email with token via SES
  - `POST /auth/reset-password` — validates token, sets new password
  - Token stored in Redis with 1-hour expiry
- [ ] **7.2** Build change password endpoint
  - `PUT /users/me/password` — requires current password + new password
- [ ] **7.3** Build guest checkout support
  - `POST /orders` accepts `guestEmail` without auth token
  - Creates temporary guest record or order without userId
  - Send order confirmation to guest email

### Frontend Tasks

- [ ] **7.4** Build forgot password page
  - `/forgot-password` — email input form
  - `/reset-password?token=...` — new password form
- [ ] **7.5** Build change password section in account
  - Current password + new password + confirm password form
- [ ] **7.6** Enhance order history page
  - Show order status with visual progress bar
  - "Track Order" button (links to tracking page from Phase 5)
  - "Download Invoice" button (from Phase 6)
  - "Request Return" button (from Phase 6)
- [ ] **7.7** Build guest checkout flow
  - Email input at checkout start
  - No login required to complete purchase

### Verification

- [ ] Forgot password email arrives with valid reset link
- [ ] Password reset works and old password is invalidated
- [ ] Guest can complete checkout without registration
- [ ] Order history shows all status, tracking, invoice, return actions

---

## Phase 8 — Notifications & WhatsApp

**Status:** ⬜ NOT STARTED
**Modules:** Notification (25), WhatsApp Automation (12)
**Depends on:** Phase 6 (order lifecycle events to trigger notifications)

### Backend Tasks

- [ ] **8.1** Build WhatsApp provider abstraction layer
  - Create `backend/src/core/whatsapp/WhatsAppProvider.ts` — abstract interface
  - Methods: `sendTemplate()`, `sendMessage()`, `getTemplateStatus()`
  - Create `backend/src/core/whatsapp/MetaCloudProvider.ts` — Meta Cloud API implementation
  - Factory: `WhatsAppProviderFactory.create(providerName)` — easily swap providers later
- [ ] **8.2** Build `notification` module
  - `notification.model.ts` — userId, channel (email/whatsapp/push), type, status, sentAt
  - Centralized dispatch service: `NotificationService.send(userId, event, data)`
  - Routes events to appropriate channel(s) based on user preferences
- [ ] **8.3** Build WhatsApp template management
  - Store approved template IDs in Settings or dedicated model
  - Templates: order_confirmation, shipping_update, delivery_notification, abandoned_cart, promotional
- [ ] **8.4** Hook notifications into order lifecycle
  - Order placed → email + WhatsApp confirmation
  - Order shipped → email + WhatsApp with tracking link
  - Order delivered → email + WhatsApp
  - Payment failed → email notification
- [ ] **8.5** Build abandoned cart detection
  - Cron job: find carts with items, no order, last updated > 1 hour
  - Send WhatsApp reminder with cart summary
- [ ] **8.6** Build admin notification dashboard
  - `GET /admin/notifications` — sent notifications log
  - `POST /admin/notifications/campaign` — send promotional WhatsApp to segment

### Frontend Tasks

- [ ] **8.7** Build admin notification settings page
  - Enable/disable channels per event type
  - WhatsApp API configuration (Meta Cloud API token, phone number ID)
  - View sent notification logs

### Verification

- [ ] WhatsApp messages send via Meta Cloud API sandbox
- [ ] Order lifecycle triggers correct notifications
- [ ] Abandoned cart cron detects and sends reminders
- [ ] Provider can be swapped by changing config (no code change)

---

## Phase 9 — Email & Newsletter

**Status:** ⬜ NOT STARTED
**Modules:** Email & Newsletter (13)
**Depends on:** Phase 8 (notification infrastructure)

> **Enterprise Newsletter System:** Template-based with predefined blocks — header, text block, image block, CTA button, product grid, social links, footer. Admin arranges blocks, fills content, schedules send. Think Mailchimp-style but custom-built.

### Backend Tasks

- [ ] **9.1** Build `newsletter` module (6-file DDD pattern)
  - `subscriber.model.ts` — email, name, isActive, subscribedAt, source
  - `campaign.model.ts` — subject, blocks[] (ordered content blocks), scheduledAt, sentAt, status
  - `newsletter-template.model.ts` — reusable template presets
- [ ] **9.2** Build subscriber management endpoints
  - `POST /newsletter/subscribe` — public endpoint
  - `POST /newsletter/unsubscribe` — with token verification
  - `GET /admin/newsletter/subscribers` — paginated list with export
  - `POST /admin/newsletter/subscribers/import` — CSV import
- [ ] **9.3** Build campaign management endpoints
  - `POST /admin/newsletter/campaigns` — create campaign with content blocks
  - `PUT /admin/newsletter/campaigns/:id` — edit
  - `POST /admin/newsletter/campaigns/:id/send` — send immediately
  - `POST /admin/newsletter/campaigns/:id/schedule` — schedule via BullMQ delayed job
  - `POST /admin/newsletter/campaigns/:id/test` — send test to admin email
- [ ] **9.4** Build email template engine
  - HTML email templates using block-based rendering
  - Block types: header (logo + title), richText, image (with alt), ctaButton (text + url), productGrid (SKUs → rendered product cards), socialLinks, footer
  - Responsive email HTML (tables-based for email client compatibility)
- [ ] **9.5** Build transactional email templates
  - Welcome email, order confirmation, shipping update, delivery, password reset, return confirmation

### Frontend Tasks

- [ ] **9.6** Build newsletter subscription component
  - Email input + subscribe button for homepage/footer
  - Toast confirmation on success
- [ ] **9.7** Build admin campaign builder page
  - Block-based editor: add/remove/reorder blocks
  - Each block type has its own form (text editor, image uploader, button config, product SKU picker)
  - Preview pane showing rendered email
  - Schedule picker (date + time)
- [ ] **9.8** Build admin subscriber management page
  - Subscriber list with search, export CSV
  - Import subscribers from CSV
  - Unsubscribe management

### DNS/Ops Tasks

- [ ] **9.9** Configure SPF record for `store4riders.com`
- [ ] **9.10** Configure DKIM signing via AWS SES
- [ ] **9.11** Configure DMARC policy

### Verification

- [ ] Subscription flow works (subscribe, confirm, unsubscribe)
- [ ] Campaign builder renders correct HTML email
- [ ] Scheduled campaigns fire at correct time via BullMQ
- [ ] Email passes SPF/DKIM checks (test with mail-tester.com)

---

## Phase 10 — Blog

**Status:** ⬜ NOT STARTED
**Modules:** Blog (14)
**Depends on:** Phase 13 (media management for image/video uploads — can start in parallel)

### Backend Tasks

- [ ] **10.1** Build `blog` module (6-file DDD pattern)
  - `blog-post.model.ts` — title, slug, content (JSON from TipTap), excerpt, featuredImage, videoUrl, categoryId, tags[], author, status (draft/published), publishedAt, metaTitle, metaDescription
  - `blog-category.model.ts` — name, slug, description
  - Add to shared types: `IBlogPost`, `IBlogCategory`
- [ ] **10.2** Build blog CRUD endpoints
  - `GET /blog/posts` — public paginated list (published only)
  - `GET /blog/posts/:slug` — public single post
  - `GET /blog/categories` — public list
  - Admin CRUD for posts and categories
- [ ] **10.3** Build related posts logic
  - Based on shared tags or category
  - `GET /blog/posts/:slug/related` — returns 3-4 related posts

### Frontend Tasks

- [ ] **10.4** Build blog listing page (`/blog`)
  - Post cards with featured image, title, excerpt, date
  - Category filter sidebar
  - Pagination
- [ ] **10.5** Build blog detail page (`/blog/[slug]`)
  - TipTap content renderer (rich text, images, embedded videos)
  - Social sharing buttons
  - Related posts section
  - SEO metadata
- [ ] **10.6** Build admin blog editor page
  - TipTap editor with toolbar: bold, italic, headings, lists, links, images (S3 upload), video embed (YouTube URL), blockquote
  - Featured image upload
  - Category and tags selection
  - SEO fields (meta title, description)
  - Draft/Publish toggle
  - Preview mode

### Verification

- [ ] Blog post creation with TipTap works end-to-end
- [ ] Video embeds render correctly on blog detail page
- [ ] SEO meta tags render for blog pages
- [ ] Related posts show relevant content

---

## Phase 11 — SEO

**Status:** ⬜ NOT STARTED
**Modules:** SEO (15)
**Depends on:** Phase 2 (product/category SEO fields), Phase 10 (blog URLs for sitemap)

### Tasks

- [ ] **11.1** Build dynamic `sitemap.xml` generation
  - `frontend/app/sitemap.ts` — Next.js sitemap API
  - Include: all products, categories, blog posts, static pages
  - Auto-update on content changes
- [ ] **11.2** Build `robots.txt`
  - `frontend/app/robots.ts` — Next.js robots API
  - Allow all crawlers, disallow `/admin`, `/api`, `/checkout`
  - Point to sitemap URL
- [ ] **11.3** Build `llms.txt`
  - `frontend/app/llms.txt/route.ts` — served as plain text
  - Content: site name and description, product categories hierarchy, brand list, key page URLs (homepage, catalog, blog, support, policies), contact information, shipping & returns policy summary, structured for AI crawlers to understand site purpose and content
- [ ] **11.4** Add JSON-LD schema markup
  - `Organization` schema on homepage
  - `Product` schema on PDP (name, price, availability, reviews, images)
  - `BreadcrumbList` on all pages with breadcrumbs
  - `BlogPosting` on blog detail pages
  - `FAQPage` on FAQ/support page
- [ ] **11.5** Add Open Graph + Twitter Card meta tags
  - All pages: title, description, image, url, type
  - Product pages: price, availability
  - Blog pages: article metadata
- [ ] **11.6** Add canonical URLs on all pages
  - Via Next.js `metadata.alternates.canonical`
- [ ] **11.7** Build Google product taxonomy mapping
  - Map store categories to Google product category IDs
  - Used in product feed (Phase 12)
- [ ] **11.8** Enforce image ALT tags
  - Audit all `<Image>` components for missing alt text
  - Add alt text from product `images[].altText` or generate from product name

### Verification

- [ ] `sitemap.xml` lists all public URLs
- [ ] `robots.txt` correctly blocks admin/API routes
- [ ] `llms.txt` accessible and comprehensive
- [ ] Google Rich Results Test validates JSON-LD schemas
- [ ] Social sharing shows correct OG preview cards

---

## Phase 12 — Analytics & Marketing

**Status:** ⬜ NOT STARTED
**Modules:** Google & Facebook Integration (16), Product Feed (17)
**Depends on:** Phase 11 (SEO taxonomy for feeds)

### Tasks

- [ ] **12.1** Add Google Tag Manager container
  - GTM script in `frontend/app/layout.tsx`
  - Environment variable for GTM container ID
- [ ] **12.2** Build GA4 event tracking utility
  - `frontend/src/core/utils/analytics.ts`
  - Events: `page_view`, `view_item`, `add_to_cart`, `remove_from_cart`, `begin_checkout`, `purchase`, `search`
  - Push to `dataLayer` for GTM
- [ ] **12.3** Build Facebook Pixel integration
  - Pixel base code in layout
  - Client-side events: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
- [ ] **12.4** Build Meta Conversion API (server-side)
  - Backend sends server events for: Purchase, AddToCart
  - Deduplication with client-side Pixel events via `eventID`
- [ ] **12.5** Build Google Merchant product feed
  - `GET /feed/google.xml` — XML feed with Google Shopping attributes
  - Fields: id, title, description, link, image_link, price, availability, brand, gtin, google_product_category
  - Daily auto-generation via cron
- [ ] **12.6** Build Facebook Catalogue feed
  - `GET /feed/facebook.csv` — CSV with Facebook Commerce attributes
  - Daily auto-generation via cron

### Verification

- [ ] GTM fires on all page loads
- [ ] GA4 receives ecommerce events
- [ ] Facebook Pixel events fire correctly (verify with Pixel Helper extension)
- [ ] Product feeds validate with Google Merchant Center and Facebook Commerce Manager

---

## Phase 13 — Media Management

**Status:** ⬜ NOT STARTED
**Modules:** Media Management (18)
**Depends on:** Phase 1 (admin UI)

### Backend Tasks

- [ ] **13.1** Build WebP conversion pipeline
  - Install `sharp` in backend
  - On upload: convert to WebP (quality 80) + keep original
  - Generate thumbnails (150px, 300px, 600px widths)
  - Store all variants in S3 with predictable naming
- [ ] **13.2** Build media library model
  - `media.model.ts` — originalUrl, webpUrl, thumbnails{}, fileName, fileType, fileSize, altText, folder, uploadedBy, createdAt
  - `GET /admin/media` — paginated media library with search
  - `DELETE /admin/media/:id` — soft delete
- [ ] **13.3** Build bulk upload endpoint
  - `POST /admin/media/bulk-upload` — returns array of presigned URLs
  - Frontend uploads in parallel with progress tracking

### Frontend Tasks

- [ ] **13.4** Build admin media manager page
  - Grid view of uploaded media
  - Upload dropzone (single + bulk)
  - Folder organization
  - Search by filename
  - Image preview with copy URL button
- [ ] **13.5** Build reusable media picker component
  - Modal that opens media library
  - Select existing or upload new
  - Returns URL to calling form (product form, blog editor, newsletter, etc.)

### Verification

- [ ] Images auto-convert to WebP on upload
- [ ] Thumbnails generate at correct sizes
- [ ] Media library search and filter works
- [ ] Media picker integrates with product and blog editors

---

## Phase 14 — Homepage & UI Polish

**Status:** ⬜ NOT STARTED
**Modules:** Homepage (1), Product Detail enhancements, Recommendation Engine
**Depends on:** Phase 2 (brands, featured products), Phase 9 (newsletter subscription)

---

### 14.R — "You May Also Like" Robust Recommendation Engine (PDP)

> **⚠️ ENTERPRISE-GRADE:** Rule-based recommendation engine (no AI/ML). Deterministic, cacheable, per-product unique results.
> Replaces the current basic `upsellSkus`-only approach with a smart 3-tier fallback system.

#### Problem Statement

The current "You May Also Like" section on PDP depends entirely on the CSV `upsell_skus` field:
- Many products have **empty** `upsellSkus` → section doesn't show at all
- Some products have only **2-3** `upsellSkus` → section looks sparse
- Different products in the same category/price range show **identical** recommendations → boring UX
- No brand diversity, no price-range awareness, no cross-category mix

#### Architecture — How It Works

**Goal:** Always show exactly **8 relevant products** on every PDP, with per-product unique results.

**3-Tier Pool Generation:**

| Priority | Source | Description |
|---|---|---|
| Tier 1 | CSV `upsellSkus` (admin-curated) | Use all available from database (0-8 products) |
| Tier 2 | Same category products | Fill remaining slots from same `magentoCategories` keyword match |
| Tier 3 | Cross-category complementary | Last 2 slots from related gear categories (Helmet → Gloves, Visor, etc.) |

**Deterministic Seed Shuffle (Per-Product Unique Results):**
- Backend fetches a **pool of 20-25 eligible products** from DB
- Uses the current product's `_id` as a **hash seed** to deterministically pick 8 from the pool
- Same product → always same 8 recommendations (no hydration errors, cacheable)
- Different product → different 8 recommendations (fresh UX every time)
- This is NOT `Math.random()` — it's a hash-based deterministic selection safe for SSR

**Diversity Rules (applied during selection from pool):**

| Rule | Description |
|---|---|
| Brand cap (global) | Max 3 products from same brand across ALL tiers combined. CSV is sacred (always included even if it exceeds cap). Auto-fill (Tier 2) uses remaining budget: `allowed = max(0, 3 - csv_brand_count)`. Example: CSV has 2 Axor → Tier 2 can add 1 more Axor + fill rest with other brands |
| Brand diversity | At least 2 different brands in the 8 results |
| Price range | ±40% of current product's price (₹4,000 helmet → pool from ₹2,400 to ₹5,600) |
| Cross-category slots | 2 of the 8 come from complementary categories (Helmet → Gloves/Visor/Jacket) |
| Self-exclusion | Current product never appears in its own recommendations |
| In-stock only | Only products with `stockStatus: 1` are included |

**Sort Priority within Pool:**

| Priority | When |
|---|---|
| `salesCount DESC` | When sales data exists (products have been sold) |
| `_id DESC` (newest first) | Cold start — no sales data yet, show latest products |

**Caching Strategy — "IDs Cache, Data Fresh":**

> **CRITICAL:** Cache only the **list of 8 product IDs** in Redis, NOT the full product data.
> When serving, always fetch **fresh product data** from MongoDB for those 8 IDs.
> This ensures price changes, stock updates, and deletions are **instantly reflected** (0 second delay).

```
Redis Key:   "recommendations:{productSlug}"
Redis Value: ["id1", "id2", "id3", "id4", "id5", "id6", "id7", "id8"]
TTL:         1 hour (auto-expire, NO manual cache invalidation needed)

Serve Flow:
  Step 1: Check Redis for cached IDs                          → ~2ms
  Step 2: If HIT → Fetch fresh product data for 8 IDs ($in)  → ~5ms
  Step 3: Filter out deleted/out-of-stock products            → instant
  Step 4: Return live data                                    → Total ~7ms

  Step 2b: If MISS → Run pool generation + shuffle (expensive) → ~30ms
         → Save 8 IDs to Redis (TTL 1hr)
         → Fetch fresh data → Return

  If Redis is down → try-catch → serve directly from DB (no crash)
```

**Why no manual cache invalidation:**
- The expensive part (pool computation + shuffle) is cached as IDs only
- The cheap part (fetching 8 products by `_id`) always hits DB for fresh data
- Deleted/OOS products are filtered out on every request (instant)
- When cache TTL expires after 1 hour, pool recomputes with any new products added
- Zero cache invalidation bugs possible — simplest and most robust approach

**Edge Cases Handled:**

| Edge Case | How It's Handled |
|---|---|
| Product has 0 upsellSkus | Tier 2+3 fill all 8 slots |
| Product has 3 upsellSkus | Use those 3, fill remaining 5 from Tier 2+3 |
| Product has 8+ upsellSkus | Use first 8 from upsellSkus, no Tier 2/3 needed |
| Category has < 6 products | Use whatever is available, fill rest from Tier 3 cross-category |
| Price range too narrow (few matches) | Widen to ±60%, then ±80%, then no price filter |
| Product deleted from DB | Filtered out at Step 3 — not shown, no dead link |
| Product goes out of stock | Filtered out at Step 3 — removed instantly |
| Price changed | Step 2 fetches fresh data — new price shown instantly |
| New product added to category | Shows up after cache TTL expires (max 1 hour) |
| Redis down | try-catch fallback to direct DB query — no error to user |
| All 8 cached products deleted | Return whatever remains (6, 4, etc.) — graceful degradation |
| Cold start (no sales data) | Sort by `_id DESC` (newest products first) instead of salesCount |
| Product `brand` is empty/null | Use `brand \|\| "unknown"` — diversity logic won't crash, treats as one brand |
| Product `magentoCategories` is empty | Skip Tier 2 category match → fill all remaining from Tier 3 cross-category |
| Product `basePrice` is 0 or null | Skip price range filter entirely → match all prices in category |

**DSA Algorithms Used (Exact Specifications):**

> **⚠️ These are the exact algorithms to implement. No `Math.random()` anywhere.**

| DSA Concept | Where Used | Algorithm | Complexity |
|---|---|---|---|
| **Seeded Fisher-Yates Shuffle** | Pick 8 from pool of 20-25 | Use product `_id` string → `crypto.createHash('md5').update(id).digest()` → extract 32-bit integer as seed → Fisher-Yates with modular arithmetic instead of `Math.random()` | O(n) time, O(1) extra space |
| **HashSet (Set\<string\>)** | Deduplication across 3 tiers | `const seen = new Set<string>()` → before adding any product, check `seen.has(id)` → prevents same product appearing from Tier 1 and Tier 2 | O(1) per lookup |
| **Greedy Selection** | Brand diversity enforcement | Iterate shuffled pool → maintain `brandCount: Map<string, number>` → skip product if `brandCount.get(brand) >= 3` → ensures max 3 per brand | O(n) single pass |
| **Progressive Widening** | Price range fallback | Try ±40% → if pool < 8, try ±60% → if still < 8, try ±80% → if still < 8, no price filter | Max 4 DB queries (rare) |

**Seeded Fisher-Yates Implementation Pseudocode:**
```
function seededShuffle(array, seedString):
  // Convert product _id to a numeric seed
  hash = crypto.createHash('md5').update(seedString).digest()
  seed = hash.readUInt32BE(0)  // First 4 bytes as unsigned 32-bit integer
  
  // Simple seeded PRNG (Mulberry32 — fast, good distribution)
  function nextRandom():
    seed = (seed + 0x6D2B79F5) | 0
    t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296  // Returns 0-1
  
  // Fisher-Yates shuffle using seeded PRNG
  for i from array.length-1 down to 1:
    j = floor(nextRandom() * (i + 1))
    swap(array[i], array[j])
  
  return array.slice(0, 8)  // Pick first 8 from shuffled array
```

**MongoDB Compound Index Required:**

> **⚠️ MUST add before deploying. Without this index, pool query will be 500ms+ instead of 15ms.**

```javascript
// Add to product.model.ts — compound index for recommendation pool query
ProductSchema.index(
  { stockStatus: 1, salesCount: -1, _id: -1 },
  { name: "idx_recommendations_pool" }
);
```
This index covers the `stockStatus: 1` filter + `salesCount DESC, _id DESC` sort in a single index scan.

**Cache Stampede Prevention:**

> When cache expires and 100 users hit the same product simultaneously, ALL 100 will miss cache and run the expensive pool query. This is called "cache stampede" or "thundering herd."

**Solution — Stale-While-Recompute with Short Lock:**
```
Step 1: Cache MISS detected
Step 2: Set a temporary Redis key "lock:rec:{slug}" with TTL 5 seconds
Step 3: If lock already exists → serve stale data (read expired key with GET, Redis keeps it briefly) OR skip cache and serve from DB (acceptable for 5 seconds)
Step 4: If lock acquired → compute pool → save to cache → delete lock
```
Alternative simpler approach: **Just accept it.** The pool query is only ~30ms. Even 100 concurrent queries = 100 × 30ms = handled easily by MongoDB. Cache stampede is only a real problem when queries take 500ms+. For 30ms queries, the simpler approach is fine.

**Decision: Use the simpler approach** (no lock). The query is fast enough. Over-engineering stampede prevention for a 30ms query adds complexity without meaningful benefit.

**Logging & Monitoring (Production Debugging):**

```typescript
// Log on cache MISS (to monitor cache hit rate)
logger.info(`[Recommendations] Cache MISS for slug=${slug}, computing pool`, { slug, productId });

// Log pool stats (to verify diversity rules are working)
logger.debug(`[Recommendations] Pool generated`, { 
  slug, tier1Count, tier2Count, tier3Count, totalPool, 
  brandsInResult: uniqueBrands.length, priceRange: { min: priceMin, max: priceMax }
});

// Log on Redis error (to catch Redis outages early)
logger.warn(`[Recommendations] Redis error, falling back to DB`, { slug, error: err.message });

// NEVER log: product data, user data, full arrays (too verbose for production)
```



- [ ] **14.R.1** Add `findRecommendationPool()` to `backend/src/modules/product/product.repository.ts`
  - Single MongoDB aggregation pipeline
  - Accepts: `excludeId`, `categoryKeywords[]`, `brand`, `priceMin`, `priceMax`, `limit` (default 25)
  - Filters: `status != "archived"`, `stockStatus: 1`, `_id != excludeId`
  - Matches: `magentoCategories` regex OR `name` regex for category keywords
  - Sort: `salesCount DESC, _id DESC` (bestsellers first, newest as tiebreaker/cold-start)
  - Returns: lean products with `.select("name slug sku basePrice specialPrice images brand magentoCategories stockStatus")`
  - Uses `.lean().exec()` — no Mongoose document overhead

- [ ] **14.R.2** Add `findCrossCategoryProducts()` to `product.repository.ts`
  - Reuses existing `findComplementaryGear()` pattern but with price-range and stock filters
  - Accepts: `excludeIds[]`, `categoryKeywords[]`, `priceMin`, `priceMax`, `limit`
  - Returns: products from DIFFERENT categories than the current product

- [ ] **14.R.3** Add `getRecommendations(slug)` to `backend/src/modules/product/product.service.ts`
  - Full business logic orchestrator:
    1. Fetch current product by slug (get `_id`, `brand`, `basePrice`, `magentoCategories`, `upsellSkus`)
    2. Calculate price range: `basePrice * 0.6` to `basePrice * 1.4` (±40%)
    3. Detect category keywords from `magentoCategories` (reuse existing keyword detection from `getKitRecommendations`)
    4. **Tier 1:** Fetch upsellSku products via `findBySkus()` (existing method)
    5. **Tier 2:** If < 6 products, call `findRecommendationPool()` for same-category products
    6. **Tier 3:** If < 8 products, call `findCrossCategoryProducts()` for complementary gear (2 slots)
    7. **Merge & Deduplicate:** Combine all tiers, remove duplicates by `_id`
    8. **Apply Diversity Rules:** Max 3 per brand, ensure 2+ brands, self-exclude
    9. **Seed Shuffle:** Use product `_id` string hash to deterministically pick exactly 8 from merged pool
    10. Return 8 product IDs
  - **Caching:** Check Redis `recommendations:{slug}` first → if HIT, use cached IDs → fetch fresh product data via `$in` query → filter deleted/OOS → return
  - **Cache MISS:** Run full pipeline above → save 8 IDs to Redis with TTL 1 hour → return fresh data
  - **Redis error:** try-catch → fallback to direct DB pipeline (no crash)
  - **Price range widening:** If pool < 8 after ±40%, widen to ±60%, then ±80%, then no filter

- [ ] **14.R.4** Add `getRecommendations` to `backend/src/modules/product/product.controller.ts`
  - Calls `ProductService.getRecommendations(slug)`
  - Returns `ApiResponse.success(products, "Recommendations fetched successfully")`

- [ ] **14.R.5** Add `GET /:slug/recommendations` route to `backend/src/modules/product/product.route.ts`
  - Public route (no auth required)
  - Add `@swagger` JSDoc documentation
  - Register in router

- [ ] **14.R.6** Add `validateGetRecommendations` to `product.validator.ts`
  - Validate `slug` param: `z.string().min(1).max(500)`

- [ ] **14.R.7** Add MongoDB compound index to `product.model.ts`
  - Index: `{ stockStatus: 1, salesCount: -1, _id: -1 }` named `idx_recommendations_pool`
  - Without this index, pool query will scan full collection (~500ms). With index: ~15ms
  - Verify with `.explain("executionStats")` that query uses index scan, not collection scan

- [ ] **14.R.8** Add logging to `getRecommendations()` in `product.service.ts`
  - `logger.info` on cache MISS (monitor hit rate)
  - `logger.debug` on pool stats (tier counts, brand count, price range)
  - `logger.warn` on Redis error (catch outages early)
  - NEVER log full product data or user data (too verbose, privacy risk)

#### Frontend Tasks

- [ ] **14.R.9** Add `useRecommendations(slug)` hook to `frontend/src/core/hooks/useProducts.ts`
  - Uses TanStack `useQuery`
  - Query key: `["recommendations", slug]`
  - Calls: `GET /products/${slug}/recommendations`
  - `enabled: !!slug`
  - `staleTime: 300000` (5 minutes — recommendations don't change rapidly)

- [ ] **14.R.10** Update `frontend/src/modules/product-detail/components/ProductDetailPageModule.tsx`
  - Replace `useProductsBySkus(upsellSkus)` with `useRecommendations(slug)`
  - Remove upsellSkus extraction logic from frontend
  - Pass new recommendation data to `UpSellProducts` component
  - Zero changes to `UpSellProducts.tsx` component itself (it already accepts `products[]` prop)

#### Verification

- [ ] **V1:** Product WITH upsellSkus → shows mix of curated + category + cross-category = 8 total
- [ ] **V2:** Product WITHOUT upsellSkus → shows 6 category + 2 cross-category = 8 total
- [ ] **V3:** Two different products in same category/price → recommendations are DIFFERENT (seed shuffle works)
- [ ] **V4:** Same product refreshed 10 times → recommendations are IDENTICAL (deterministic, no hydration error)
- [ ] **V5:** Product deleted from DB → disappears from recommendations immediately (live data fetch)
- [ ] **V6:** Product price changed → new price shows immediately in recommendations
- [ ] **V7:** Product goes out of stock → removed from recommendations immediately
- [ ] **V8:** Redis down → recommendations still load from DB (graceful fallback)
- [ ] **V9:** Category has < 6 products → fills with cross-category, no empty slots
- [ ] **V10:** Max 3 products from same brand in results (brand diversity enforced)
- [ ] **V11:** API response time < 35ms (cached) and < 50ms (uncached)
- [ ] **V12:** Cold start (all salesCount = 0) → shows newest products instead of empty

---

### Tasks

- [ ] **14.1** Consolidate homepage modules
  - Merge best components from `src/modules/home/` and `src/modules/homepage/`
  - Wire: NewArrivals, BrandMarquee, PromoBanner, FeaturedProducts, Bestsellers into active homepage
  - Remove unused duplicate module
- [ ] **14.2** Build admin-manageable homepage banners
  - Backend: `homepage-banner.model.ts` — image, link, title, subtitle, position, isActive, sortOrder
  - Admin UI: banner management with image upload, drag-to-reorder
  - Frontend: HeroSection reads from API instead of hardcoded data
- [ ] **14.3** Build product comparison feature
  - Frontend: `useCompareStore` (Zustand) — max 4 products
  - "Add to Compare" button on product cards and PDP
  - `/compare` page — side-by-side comparison table
- [ ] **14.4** Enhance PDP with video support
  - YouTube embed player on PDP (if `videoUrl` is set)
  - Video tab or inline player below gallery
- [ ] **14.5** Add hover-zoom on product gallery (desktop)
  - Mouse-follow zoom lens on main image
  - Mobile: pinch-to-zoom via CSS `touch-action`
- [ ] **14.6** Wire newsletter subscription into footer
  - Connect footer email input to `POST /newsletter/subscribe`

### Verification

- [ ] Homepage renders all sections with real data from API
- [ ] Admin can manage hero banners
- [ ] Product comparison works with 2-4 products
- [ ] Video plays on PDP
- [ ] Newsletter subscription from footer works

---

## Phase 15 — Data Migration

**Status:** ⬜ NOT STARTED
**Modules:** Website Migration (23)
**Depends on:** Phase 2 (brand model, enhanced product model)

> **Client Rule:** ALL data must be migrated. No records skipped silently. Corrupted data flagged for manual review.

### Tasks

- [ ] **15.1** Build comprehensive migration script
  - Read all Magento CSV data
  - Map every field to new schema (including new fields from Phase 2)
  - Generate detailed report: total records, successful, failed, warnings
  - Failed records saved to `migration-errors.csv` with row number and error reason
- [ ] **15.2** Migrate product data
  - All products from Magento CSVs → MongoDB
  - Map prices, images, variants, related SKUs, upsell SKUs
  - Verify image URLs resolve to S3
- [ ] **15.3** Auto-generate category tree
  - Parse `magentoCategories` strings (e.g., "Riding Gear/Helmets/Full Face")
  - Build hierarchical category tree with `parentId` references
  - Assign `categoryId` on each product
- [ ] **15.4** Populate brand data
  - Extract unique brands from products
  - Create Brand records
  - Link products to Brand IDs
- [ ] **15.5** Migration audit report
  - Count verification: Magento records vs MongoDB records
  - Field coverage: which fields have data, which are empty
  - Image audit: which product images are accessible on S3
  - Generate final audit `.md` file

### Verification

- [ ] 100% of Magento records accounted for (migrated or flagged)
- [ ] Zero silent data loss
- [ ] Category tree reflects Magento hierarchy
- [ ] All product images load from S3
- [ ] Migration audit report shows complete coverage

---

## Phase 16 — Security, Performance & Launch

**Status:** ⬜ NOT STARTED
**Modules:** Security (21), Performance (22), Audit Logs
**Depends on:** All previous phases

### Security Tasks

- [ ] **16.1** Add CSP headers
  - Whitelist scripts (GTM, GA4, Razorpay, PayU, etc.), styles, images, fonts
  - Test with report-only mode first
- [ ] **16.2** Add CSRF protection
  - Generate CSRF token on page load
  - Validate on all state-changing requests
- [ ] **16.3** Build audit log system
  - `audit-log.model.ts` — action, userId, resourceType, resourceId, oldValue, newValue, ip, timestamp
  - Log all admin actions: product create/update/delete, order status changes, user role changes
  - `GET /admin/audit-logs` — searchable, filterable log viewer
- [ ] **16.4** Security review
  - Audit all endpoints for NoSQL injection
  - Verify all inputs validated via Zod
  - Verify no raw `Error()` throws
  - Verify no `console.log` in production code

### Performance Tasks

- [ ] **16.5** Set up CloudFront CDN
  - Serve S3 images via CloudFront
  - Cache static assets with long TTL
  - Update image URLs to use CloudFront domain
- [ ] **16.6** MongoDB index audit
  - Ensure indexes on: `slug`, `sku`, `categoryId`, `brand`, `status`, `createdAt`
  - Add compound indexes for common query patterns
- [ ] **16.7** Bundle size optimization
  - Run `next build --analyze` for frontend
  - Target: First Load JS < 100KB per route
  - Dynamic import heavy components (TipTap, charts, comparison table)
- [ ] **16.8** Lighthouse CI
  - Run Lighthouse audit on key pages (home, PDP, catalog, checkout)
  - Target: Performance > 90, Accessibility > 90, SEO > 95
- [ ] **16.9** Core Web Vitals monitoring
  - Add `web-vitals` library
  - Send CWV metrics to GA4

### Testing Tasks

- [ ] **16.10** Write E2E tests for critical flows
  - Login → Browse → Add to Cart → Checkout → Payment → Order Confirmation
  - Admin: Login → Create Product → Manage Order
  - Search → Filter → Sort → Product Detail
- [ ] **16.11** Run full test suite
  - `pnpm test` — all unit tests pass
  - `pnpm test:e2e` — all E2E tests pass
  - `pnpm build` — both frontend and backend build without errors

### Launch Checklist

- [ ] **16.12** Production environment setup
  - All environment variables configured
  - MongoDB Atlas production cluster
  - Redis production instance
  - Meilisearch production instance
  - AWS services (S3, SES, CloudFront) production
  - Domain DNS configured
  - SSL certificate active
- [ ] **16.13** Pre-launch verification
  - All API endpoints documented in Swagger
  - Health check endpoint returns green
  - Error monitoring configured
  - Backup strategy in place

### Verification

- [ ] All security headers present (verify with securityheaders.com)
- [ ] Lighthouse scores meet targets
- [ ] All E2E tests pass
- [ ] Production deployment successful
- [ ] Zero critical errors in first 24 hours

---

## Done! 🎉

When all 16 phases are marked `✅ COMPLETED`, the Store4Riders platform is production-ready with all 26 modules from the Scope of Work fully implemented.
