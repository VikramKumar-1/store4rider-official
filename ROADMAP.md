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
| Payment Gateways | Do **all** step by step — Razorpay ✅ → PayU → CCavenue → Snapmint |
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
| 2 | Product & Catalog Enhancement | Product Catalogue, Brand Mgmt, Category | ⬜ NOT STARTED |
| 3 | Search & Discovery | Search & Filter (Meilisearch) | ⬜ NOT STARTED |
| 4 | Payment Gateways | Payment Module (PayU, CCavenue, Snapmint, COD) | ⬜ NOT STARTED |
| 5 | Shipping & Logistics | Shipping (Shiprocket, Delhivery, Xpressbees) | ⬜ NOT STARTED |
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

**Status:** ⬜ NOT STARTED
**Modules:** Product Catalogue (2), Category (4), Brand Management
**Depends on:** Phase 1 (admin UI to manage products)

### Backend Tasks

- [ ] **2.1** Build `brand` module (6-file DDD pattern)
  - `brand.model.ts` — `name`, `slug`, `logo`, `description`, `isActive`
  - Full CRUD: `GET /brands`, `POST /brands`, `PUT /brands/:id`, `DELETE /brands/:id`
  - Add to `packages/shared-types/src/brand.types.ts` — `IBrand` interface
- [ ] **2.2** Enhance Product model
  - Add fields: `status` (draft/published/archived), `isFeatured`, `tags[]`, `videoUrl`, `documents[]` (array of `{name, url}`)
  - Update `packages/shared-types/src/product.types.ts`
  - Update `packages/shared-validation/src/product.schema.ts`
- [ ] **2.3** Build CSV bulk stock/pricing update
  - `POST /admin/products/bulk-update` — accepts CSV upload
  - CSV columns: `sku`, `basePrice`, `specialPrice`, `stockStatus`
  - Returns validation report: success count, error rows with reasons
  - Wrap in MongoDB transaction for atomicity
- [ ] **2.4** Enhance Category model
  - Add fields: `bannerImage`, `metaTitle`, `metaDescription`, `metaKeywords`, `videoUrl`, `slug`
  - Update shared types and validation
- [ ] **2.5** Build bestseller tracking
  - Increment `salesCount` on product when order is delivered
  - `GET /products?sort=bestselling` support

### Frontend Tasks

- [ ] **2.6** Build admin product management UI
  - Product list page with search, filters (status, category, brand), bulk actions
  - Product create/edit form (all fields including new ones)
  - CSV upload page for bulk stock/pricing update with preview & error report
- [ ] **2.7** Build admin category management UI
  - Category tree view with drag-to-reorder
  - Category create/edit form with banner upload, SEO fields
- [ ] **2.8** Build admin brand management UI
  - Brand list, create/edit form with logo upload
- [ ] **2.9** Build frontend category landing pages
  - `/category/[slug]` route with banner, description, filtered products
- [ ] **2.10** Implement recently viewed products
  - Client-side localStorage tracking (last 10 products)
  - "Recently Viewed" section on homepage and PDP

### Verification

- [ ] Admin can CRUD products, categories, brands
- [ ] CSV bulk update works with validation report
- [ ] Category pages render with banners and SEO meta
- [ ] Recently viewed products persist across page navigation
- [ ] Bestseller sort returns products by sales count

---

## Phase 3 — Search & Discovery

**Status:** ⬜ NOT STARTED
**Modules:** Search & Filter (5)
**Depends on:** Phase 2 (product enhancements for attribute filters)

### Backend Tasks

- [ ] **3.1** Complete Meilisearch integration
  - Index all products on startup (one-time sync)
  - Auto-index on product create/update/delete
  - Configure searchable attributes, filterable attributes, sortable attributes
- [ ] **3.2** Build search autocomplete endpoint
  - `GET /search/suggest?q=...` — returns top 5 product suggestions + top 3 category matches
- [ ] **3.3** Build advanced filter endpoint
  - Dynamic attribute extraction from product variants (sizes, colours)
  - `GET /products?size=L&colour=Black&brand=Clan&priceMin=500&priceMax=5000`
- [ ] **3.4** Add sort options
  - `sort=newest` (by createdAt desc)
  - `sort=bestselling` (by salesCount desc)
  - `sort=rating` (by avgRating desc — needs aggregate rating field)

### Frontend Tasks

- [ ] **3.5** Build autocomplete search dropdown
  - Debounced input (300ms)
  - Dropdown with product thumbnails, category links
  - Keyboard navigation (arrow keys + enter)
- [ ] **3.6** Enhance sidebar filters
  - Dynamic size filter (from variant attributes)
  - Dynamic colour filter (with colour swatches)
  - Brand filter with checkboxes
  - Active filter tags with clear buttons
- [ ] **3.7** Add sort dropdown to catalog page
  - Newest, Bestselling, Price Low→High, Price High→Low, Rating

### Verification

- [ ] Search returns relevant results with typo tolerance
- [ ] Autocomplete shows suggestions as user types
- [ ] Filters narrow results correctly and combine with each other
- [ ] Sort options work correctly
- [ ] Meilisearch stays in sync with MongoDB

---

## Phase 4 — Payment Gateways

**Status:** ⬜ NOT STARTED
**Modules:** Payment Gateway (10), Checkout enhancement (8)
**Depends on:** None (Razorpay already works)

### Backend Tasks

- [ ] **4.1** Build payment gateway abstraction layer
  - Create `backend/src/core/payments/PaymentGateway.ts` — abstract interface
  - Methods: `createOrder()`, `verifyPayment()`, `initiateRefund()`, `getPaymentStatus()`
  - Create `backend/src/core/payments/RazorpayGateway.ts` — migrate existing Razorpay logic
  - Create `backend/src/core/payments/PayUGateway.ts`
  - Create `backend/src/core/payments/CCavenueGateway.ts`
  - Create `backend/src/core/payments/SnapmintGateway.ts`
  - Factory: `PaymentGatewayFactory.create(gatewayName)` returns correct implementation
- [ ] **4.2** Integrate PayU
  - PayU hash generation, redirect flow, response verification
  - Webhook endpoint for async status updates
- [ ] **4.3** Integrate CCavenue
  - Encryption/decryption flow, redirect handling
  - Response verification
- [ ] **4.4** Integrate Snapmint
  - EMI/BNPL flow integration
  - Webhook for payment status
- [ ] **4.5** Build COD with partial payment
  - Admin-configurable Settings: `codPartialPaymentType` (percentage/fixed), `codPartialPaymentValue`
  - `POST /orders` accepts `paymentMethod: "cod"` or `paymentMethod: "cod_partial"`
  - For partial: collect online amount via any gateway, mark remaining as COD
  - Track `paidAmount`, `codAmount`, `totalAmount` on Order model
- [ ] **4.6** Build payment audit log
  - `payment-log.model.ts` — log every payment attempt, status change, refund
  - Fields: orderId, gateway, amount, status, rawResponse, timestamp

### Frontend Tasks

- [ ] **4.7** Build payment method selection UI in checkout
  - Radio buttons: Razorpay, PayU, CCavenue, Snapmint (EMI), COD
  - Show partial payment amount for COD option
  - Gateway-specific redirect handling
- [ ] **4.8** Build admin payment settings page
  - Enable/disable each gateway
  - COD partial payment configuration
  - Payment log viewer

### Verification

- [ ] Each gateway processes test payments successfully
- [ ] Payment verification works for each gateway
- [ ] COD orders with partial payment create correctly
- [ ] Payment logs capture all transactions
- [ ] Refund flow works through each gateway

---

## Phase 5 — Shipping & Logistics

**Status:** ⬜ NOT STARTED
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

- [ ] **5.7** Build shipping rate selection in checkout
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
**Modules:** Homepage (1), Product Detail enhancements
**Depends on:** Phase 2 (brands, featured products), Phase 9 (newsletter subscription)

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
