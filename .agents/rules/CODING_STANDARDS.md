---
name: store4riders-coding-standards
description: Strict enterprise coding standards, UI separation, and backend business logic rules.
trigger: always_on
---
# Store4Riders — Enterprise Coding Standards & Architecture Rules

> **⚠️ MANDATORY: Every agent MUST read this ENTIRE file before writing ANY code.**
> These rules are NON-NEGOTIABLE. Violating them will break production.
> Think like a Senior Staff Engineer with 15+ years of experience.

---

## 0. TECH STACK (Exact Versions)

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | Next.js (App Router) | `15.1.6` |
| **Backend** | Next.js (API Routes) | `latest` (15.x) |
| **Database** | MongoDB (via Mongoose) | Atlas |
| **Cache** | Redis (via ioredis) | — |
| **Payments** | Razorpay | — |
| **Search** | Meilisearch | — |
| **Storage** | AWS S3 | `ap-south-2` region |
| **Email** | AWS SES (via BullMQ queue) | — |
| **CSS** | Tailwind CSS | 3.x |
| **State (Server)** | TanStack React Query | — |
| **State (Client)** | Zustand | — |
| **Forms** | React Hook Form + Zod | — |
| **Testing** | Vitest + Playwright | — |
| **Monorepo** | Turborepo + PNPM workspaces | — |

> **Framer Motion:** Installed but use MINIMALLY. This is an e-commerce site, not a portfolio. Heavy animations slow down page load and hurt conversion. Use CSS transitions (`transition-all duration-300`) for hover/fade effects. Framer only for modals and complex page transitions if absolutely necessary.

> **Version Upgrades:** Before upgrading ANY dependency (Next.js, React, Tailwind, etc.), check the official changelog for breaking changes. NEVER blindly upgrade. Test locally after upgrade. Pin exact versions in `package.json` for stability (e.g., `"next": "15.1.6"`, not `"next": "latest"`). The backend currently uses `"next": "latest"` — consider pinning it for production stability.

---

## 1. GOLDEN RULES (Read First, Code Later)

1. **NEVER rewrite existing functions.** Search the codebase FIRST. If a utility, hook, service method, or component exists — **import and reuse it**.
2. **NEVER duplicate code.** Shared logic goes in `packages/shared-*`.
3. **NEVER use hardcoded URLs, keys, or secrets.** Use `process.env.*` variables. Domain, bucket, and keys WILL change between environments.
4. **NEVER use `Math.random()` in SSR/RSC components.** It causes React Hydration mismatch errors. Use fixed values or `useId()`.
5. **NEVER use dark mode** unless user explicitly requests it.
6. **NEVER write comments in Hinglish.** English only — code, comments, logs, docs, everything.
7. **Preserve all existing comments and docstrings** unrelated to your changes.
8. **Do NOT use `<a>` tags for internal navigation.** Always use Next.js `<Link>`.
9. **Do NOT use `console.log` in production code.** Use `logger` from `@/core/utils/logger`.
10. **Do NOT commit `.env` files, secrets, or API keys.** Use `.env.example` for templates.
11. **ALWAYS test your changes.** If you add a function, verify it works. If you modify a function, verify nothing breaks.
12. **ALWAYS update Swagger docs** when you add or modify an API endpoint.
13. **Frontend = UI ONLY.** The frontend solely renders the UI. ALL business logic, calculations, price computations, discount logic, and validations MUST live in the backend Service layer. Frontend NEVER does business logic.
14. **Pagination = ALWAYS from Backend.** Pagination is handled by the backend via `ApiResponse.paginated()`. Frontend passes `page` and `limit` query params. Frontend NEVER does client-side pagination on full datasets.
15. **NEVER store JWTs in localStorage or sessionStorage.** Tokens are stored ONLY in HttpOnly cookies. The Zustand `useAuthStore` stores the token for Axios interceptor only — it comes FROM the cookie-based auth flow.
16. **NEVER add heavy animation libraries.** Use CSS transitions (`transition-*` Tailwind classes) for simple effects. Framer Motion only when absolutely required (modals, complex page transitions). This is an e-commerce site — speed > animation.

---

## 2. Monorepo Structure

```
store4riders/
├── backend/                  # SERVER-SIDE ONLY — Pure API server (Port 4000). No UI rendering.
├── frontend/                 # CLIENT + SSR — Next.js 15 App Router (Port 3000). Renders UI + SSR pages.
├── packages/
│   ├── shared-types/         # Domain interfaces (IProduct, IUser, IOrder, etc.)
│   ├── shared-utils/         # Pure utilities (slugify, formatCurrency, etc.)
│   ├── shared-validation/    # Zod schemas (createProductSchema, etc.)
│   ├── typescript-config/    # Shared tsconfig bases
│   └── eslint-config/        # Shared ESLint rules
├── e2e/                      # Playwright E2E tests
└── backup-data/              # Legacy Magento CSV + import scripts
```

**Package manager:** PNPM with workspaces.  
**Build orchestrator:** Turborepo.

> **Clarification:** The `backend/` folder is a **pure server-side API server**. It handles all REST API endpoints, database operations, payment processing, email queues, etc. It does NOT render any UI. 
> 
> **Important Distinction:** This is a separate REST API. It is NOT using Next.js Server Actions (`"use server"`). The `frontend/` folder is a Next.js App Router application that renders the customer-facing UI with SSR/SSG and talks to the `backend/` via standard HTTP requests (Axios/TanStack Query).

---

## 3. Backend Architecture — DDD (Domain-Driven Design)

Strict Layered Pattern: **Route → Controller → Service → Repository → Model**

All business logic lives in the **Service layer**. Controllers are thin. Repositories are DB-only.

### 3.1 Request Flow (NEVER bypass any layer)
```
HTTP Request
  → app/api/[[...route]]/route.ts  (catch-all handler)
    → connectToDatabase()
    → applyCors() + applySecurityHeaders() + applyRequestId()
    → centralRouter(req, routePath)  (router.ts)
      → <module>Router(req, routePath)  (module route handler)
        → middleware (extractUserFromAuth, checkAdmin, checkRateLimit)
        → Controller.method(req)
          → Validator.validate(req)  ← Zod validation (EVERY endpoint)
          → Service.businessLogic()  ← ALL business rules here
            → Repository.databaseQuery()  ← ONLY layer touching Mongoose
        → ApiResponse.success() / ApiResponse.paginated()
      → errorHandler(error)  ← Catches all errors, returns safe response
```

> **CRITICAL:** Business logic (price calculation, discount logic, stock checks, coupon validation, order totals) MUST be in the Service layer. NEVER in Controller, NEVER in Frontend.

### 3.2 Module File Pattern (STRICT — 6 files per module)

Every module lives in `backend/src/modules/<module-name>/` with **exactly** these files:

| File | Layer | Class Pattern | Key Rules |
|---|---|---|---|
| `<module>.model.ts` | Mongoose Schema | `new Schema<IEntity>()` | Use `mongoose.models.X \|\| mongoose.model()` to prevent hot-reload crashes |
| `<module>.repository.ts` | Data Access | `class XRepository` with `static async` methods | ONLY file that touches Mongoose. Use `.lean().exec()`. Accept optional sessions for transactions. |
| `<module>.service.ts` | Business Logic | `class XService` with `static async` methods | Calls Repository. Throws `AppError` subclasses. NEVER access Mongoose directly. |
| `<module>.controller.ts` | HTTP Handler | `class XController` with `static async` methods | Calls Validator → Service → `ApiResponse.success()` or `ApiResponse.paginated()` |
| `<module>.validator.ts` | Validation | `class XValidator` with `static` methods | Uses Zod schemas from `@store4riders/shared-validation`. Parses query & body. |
| `<module>.route.ts` | Router + Swagger | `export async function xRouter()` | Pattern-matches `method + routePath`. Contains `@swagger` JSDoc. Applies middlewares. |

**DO NOT create extra files.** If you need a helper, put it in `core/utils/`.

### 3.3 API Response Format (NEVER deviate)

```typescript
// Success — single item
ApiResponse.success(data, "Product fetched successfully", 200)
// → { success: true, data: {...}, message: "...", statusCode: 200, timestamp: "..." }

// Success — paginated list
ApiResponse.paginated(items, totalCount, page, limit)
// → { success: true, data: { items: [...], totalCount, page, limit, totalPages }, ... }

// Error
ApiResponse.error("Product not found", 404)
// → { success: false, error: "...", statusCode: 404, timestamp: "..." }
```

### 3.4 Error Classes (ALWAYS use these, NEVER throw raw `Error`)

| Class | Status | Usage |
|---|---|---|
| `NotFoundError("Product")` | 404 | Resource not found |
| `UnauthorizedError("msg")` | 401 | Auth failure |
| `ForbiddenError("msg")` | 403 | Permission denied |
| `ValidationError("msg")` | 400 | Bad input |
| `ConflictError("msg")` | 409 | Duplicate resource |

### 3.5 Swagger / API Documentation

Every route MUST have `@swagger` JSDoc comments. When you add/modify an endpoint:
1. Add `@swagger` block with `summary`, `tags`, `parameters`, `requestBody`, `responses`
2. Verify Swagger UI renders correctly at `/api/v1/docs`
3. Keep examples up to date

---

## 4. Frontend Architecture (`frontend/`)

### 4.1 App Directory (`frontend/app/`)

Pages are **thin wrappers**. They ONLY define metadata and render a module component:

```typescript
// app/products/[slug]/page.tsx
import { ProductDetailPageModule } from "@/modules/product-detail/components/ProductDetailPageModule";
export const metadata = { title: "Product Details | Store4Riders" };
export default function ProductDetailPage() {
  return <ProductDetailPageModule />;
}
```

**DO NOT put business logic, data fetching, or complex JSX in `app/` pages.**

### 4.2 Feature Modules (`frontend/src/modules/<module-name>/`)

```
src/modules/<module-name>/
├── index.tsx              # Main exported component
├── components/            # Sub-components
│   ├── ComponentA.tsx
│   └── ComponentB.tsx
└── types/                 # Feature-specific TypeScript interfaces
    └── <module>.types.ts
```

### 4.3 State Management Stack

| Tool | Purpose | Location | Persistence |
|---|---|---|---|
| **TanStack Query** | Server state (API data) | `src/core/hooks/use*.ts` | Auto-cached in memory |
| **Zustand** | Client state (auth, cart, UI) | `src/stores/use*Store.ts` | `localStorage` via `persist` |
| **React Hook Form + Zod** | Form state & validation | Inside form components | None |

### 4.4 TanStack Query Hook Pattern

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";

export function useProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await apiClient.get(`/products/${slug}`);
      return response.data.data;
    },
    enabled: !!slug,
  });
}
```

**Rules:**
- One file per domain in `src/core/hooks/`
- `useQuery` for reads, `useMutation` for writes
- Always destructure `response.data.data` (API wraps in `{ success, data }`)
- Use `enabled` for conditional queries
- NEVER fetch inside components directly — always use hooks

### 4.5 Zustand Store Pattern

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({ /* state + actions */ }),
    { name: "auth-storage" }
  )
);
```

### 4.6 API Client — Single Instance Only

- `apiClient` is the ONLY Axios instance. **DO NOT create new instances.**
- It auto-injects `Authorization: Bearer` from Zustand
- `withCredentials: true` for cookies
- Base URL from `NEXT_PUBLIC_API_URL`

---

## 5. Import Conventions

```typescript
// Workspace packages
import { IProduct } from "@store4riders/shared-types";
import { slugify } from "@store4riders/shared-utils";
import { createProductSchema } from "@store4riders/shared-validation";

// Frontend path aliases (@/* → ./src/*)
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/Button";
import { AuthModule } from "@/modules/auth";

// Backend path aliases (@/* → ./src/*)
import { logger } from "@/core/utils/logger";
import { ApiResponse } from "@/core/response/ApiResponse";

// Within modules — relative paths OK
import { ProductService } from "./product.service";
```

---

## 6. Styling & UI Rules (Frontend = UI ONLY)

> The frontend solely renders the UI and relies on the backend for ALL business logic, calculations, and validations. Frontend does NOT compute prices, discounts, totals, or stock availability. It receives pre-computed data from the API.

- **Framework:** Tailwind CSS 3.x
- **NO dark mode** unless explicitly requested
- **Brand colors:** `brand` (#AB1509), `banner` (#FF5429)
- **Fonts:** `font-sans` (Inter via `--font-inter`), `font-serif` (Georgia)
- **Images:** ALWAYS use Next.js `<Image>` with `fill` + `sizes` prop. NEVER use raw `<img>`
- **Links:** ALWAYS use `<Link>` from `next/link`. NEVER use `<a>` for internal routes
- **Icons:** `@heroicons/react` (primary), `lucide-react` (secondary)
- **Animations:** Prefer CSS transitions (`transition-all duration-300`). Use Framer Motion ONLY for modals/complex interactions. This is e-commerce — speed matters more than fancy animations
- **Responsive:** Mobile-first approach. Test at 375px, 768px, 1024px, 1440px breakpoints
- **Pagination:** Display pagination controls, but actual pagination logic is backend. Pass `?page=1&limit=20` to API. NEVER load all products and paginate on frontend

---

## 7. Database Field Names (MongoDB ↔ CSV ↔ Frontend)

> **CRITICAL:** These are the ACTUAL MongoDB field names. Use them EXACTLY.

| MongoDB Field | CSV Column | Type | Notes |
|---|---|---|---|
| `name` | `name` | String | Product name |
| `description` | `description` | String | Full HTML description |
| `shortDescription` | `short_description` | String | Plain text |
| `slug` | `url_key` | String | SEO-friendly URL |
| `sku` | `sku` | String | Stock keeping unit |
| `basePrice` | `price` | Number | Original price (**NOT** `priceInUSD`) |
| `specialPrice` | `special_price` | Number | Sale price (**NOT** `salePrice`) |
| `categoryId` | — | String | Category reference (**NOT** `category`) |
| `stockStatus` | `is_in_stock` | Number | 0 or 1 (**NOT** `stockQuantity`) |
| `productType` | `product_type` | String | `"simple"` or `"configurable"` |
| `images` | `base_image` + `additional_images` | Array | `[{ id, url, altText }]` |
| `variants` | — | Array | `[{ id, sku, price, stock, attributes }]` |
| `configurableVariations` | `configurable_variations` | String | Legacy Magento variant string |
| `relatedSkus` | `related_skus` | String[] | SKUs for "Complete Your Kit" |
| `upsellSkus` | `upsell_skus` | String[] | SKUs for "Up Sell Products" |
| `magentoCategories` | `categories` | String | Legacy category path |
| `brand` | — | String | Brand name |
| `weight` | `weight` | Number | Product weight |
| `metaTitle` | `meta_title` | String | SEO title |
| `metaKeywords` | `meta_keywords` | String | SEO keywords |
| `metaDescription` | `meta_description` | String | SEO description |

---

## 8. Security Rules (Production Safety)

### 8.1 Authentication & Token Security
- **No localStorage:** NEVER store JWTs in `localStorage` or `sessionStorage`. This is a strict security requirement.
- **Strict Cookies:** Access and Refresh tokens MUST use `httpOnly: true`, `secure: true`, `sameSite: "strict"` cookies.
- **Token Invalidation:** Logout MUST immediately blacklist the refresh token in Redis. Do not rely on expiry alone.
- Dual token support: `Authorization: Bearer <token>` header (mobile/Swagger) OR `accessToken` HTTP-only cookie (web)
- Access token: 15 minutes expiry. Refresh token: 7 days expiry
- Admin routes: ALWAYS verify via `extractUserFromAuth()` → `checkAdmin()`
- NEVER trust frontend input. ALWAYS validate server-side with Zod

### 8.2 Input Validation & Sanitization (NoSQL Injection Prevention)
- ALL user input MUST be validated via `Validator` class using strict Zod schemas
- **EVERY API endpoint** must validate against strict Zod schemas. No exceptions.
- Sanitize HTML inputs to prevent XSS (especially product descriptions from CSV)
- Sanitize all MongoDB query inputs to prevent NoSQL injection (`$gt`, `$ne` attacks)
- Limit string lengths in Zod schemas (e.g., `z.string().max(500)`)
- Validate file types and sizes for uploads
- Use parameterized queries — NEVER concatenate user input into queries

### 8.3 Rate Limiting & Anti-Spam
- Auth routes: Strict IP-based rate limiting via Redis (`rate-limiter-flexible`)
- Rate limit: 5 requests per 15 minutes per IP on auth endpoints via `checkRateLimit()`
- Public APIs: Rate limit heavy endpoints (search, product list)
- Add CAPTCHA for registration/contact forms in production
- Block suspicious IPs after repeated failures

### 8.4 Security Headers (Applied Globally via Middleware)
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- CORS: Strictly allow ONLY the explicit frontend domain. No wildcards in production.
- Helmet.js compatible security headers on every response

### 8.5 Secrets & Environment
- NEVER commit `.env` files. Use `.env.example` as template
- Rotate JWT secrets periodically
- Use different secrets per environment (dev, staging, prod)
- AWS credentials: Use IAM roles in production, not access keys

---

## 9. Performance & Optimization

### 9.1 Frontend Performance
- **Code Splitting:** Next.js does this automatically. Use `dynamic()` for heavy components
- **Image Optimization:** ALWAYS use `next/image` with proper `sizes` attribute. Use WebP/AVIF formats
- **Lazy Loading:** Use `loading="lazy"` for below-the-fold images
- **Bundle Size:** Monitor with `next build --analyze`. Keep First Load JS < 100KB per route
- **Memoization:** Use `React.memo()` for expensive list item components. Use `useMemo`/`useCallback` only when profiling shows need — don't prematurely optimize
- **Font Loading:** Use `next/font` with `display: swap` to prevent layout shifts
- **Prefetching:** `<Link>` auto-prefetches. Use `prefetch={false}` for rarely visited links

### 9.2 Backend Performance
- **Database Queries:** ALWAYS use `.lean()` for read queries (returns plain JS objects, not Mongoose documents)
- **Indexing:** Ensure indexes on frequently queried fields (`slug`, `sku`, `categoryId`)
- **Pagination:** NEVER return unbounded results. Default `limit: 20`, max `limit: 100`
- **Caching:** Use Redis cache (`setCache`/`getCache`) for hot data (categories, popular products)
- **Connection Pooling:** Mongoose auto-pools connections. NEVER create new connections per request
- **Select Fields:** When you don't need all fields, use `.select("name slug basePrice images")` to reduce payload
- **Avoid N+1:** When fetching related data, use `$in` queries instead of loops

### 9.3 API Performance
- **Response Compression:** Enable gzip/brotli in production
- **Cache Headers:** Set `Cache-Control` for static resources and CDN
- **Debounce Search:** Frontend search inputs should debounce (300ms minimum)
- **Stale-While-Revalidate:** TanStack Query `staleTime: 60000` already configured

---

## 10. Error Handling (Graceful, Never Crash)

### 10.1 Backend Error Handling
- ALWAYS throw `AppError` subclasses, NEVER raw `Error()`
- The global `errorHandler` catches everything — `AppError`, `ZodError`, and unknown errors
- Unknown errors return 500 `"Internal Server Error"` — NEVER expose stack traces to client
- Log all errors with `logger.error()` including request context

### 10.2 Frontend Error Handling
- Wrap page-level components with React Error Boundaries
- Show user-friendly error states (not stack traces)
- API errors: Use `toast.error()` from Sonner for user feedback
- Network errors: Show "Connection failed, please try again"
- NEVER show raw error objects to users

### 10.3 Loading States
- ALWAYS show loading spinners/skeletons during data fetching
- NEVER show blank pages while loading
- Use existing spinner pattern: `<div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin">`

---

## 11. Testing Standards

### 11.1 Testing Stack
- **Unit:** Vitest + React Testing Library (frontend), Vitest (backend)
- **E2E:** Playwright in `e2e/` directory
- **Run:** `pnpm test` via Turborepo

### 11.2 What to Test
- **Backend:** Service methods (business logic), validator edge cases, error scenarios
- **Frontend:** Component rendering, user interactions, form validation
- **E2E:** Critical user flows (login → browse → add to cart → checkout)

### 11.3 Test Rules
- Test files co-located with source (`__tests__/` or `*.test.ts`)
- Test the behavior, not the implementation
- Mock external services (S3, Redis, payment gateways)
- NEVER skip error case tests

---

## 12. Git & Version Control

### 12.1 Commit Messages
Use conventional commits format:
```
feat: add product review endpoint
fix: correct specialPrice mapping in PDP
refactor: extract category parser to shared-utils
docs: update API documentation for by-skus endpoint
chore: upgrade next.js to 15.1
```

### 12.2 Branching (Current: Solo Developer on `main`)
- Currently working directly on `main` branch (solo developer)
- When team grows, switch to:
  - `main` — production-ready code only
  - `develop` — integration branch
  - `feature/<name>` — new features
  - `fix/<name>` — bug fixes

### 12.3 Rules
- Write clean, descriptive commit messages
- Commit frequently — small focused commits > large dump commits
- NEVER commit `.env`, `node_modules`, or build artifacts
- When team grows: NEVER push directly to `main`, use PRs

---

## 13. Deployment & Live Server Safety

### 13.1 Pre-Deployment Checklist
- [ ] All tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Environment variables set in production
- [ ] Database migrations applied (if any)
- [ ] Swagger docs updated for new endpoints

### 13.2 Zero-Downtime Rules
- NEVER make breaking API changes without versioning
- NEVER drop database columns/fields without data migration
- NEVER change response shapes without frontend coordination
- Use feature flags for risky features
- Always have a rollback plan

### 13.3 Database Safety
- NEVER run raw `deleteMany()` or `updateMany()` without filters
- ALWAYS back up data before migrations
- Use Mongoose transactions for multi-document operations
- Test migrations on staging BEFORE production

### 13.4 Monitoring (Production)
- Health check endpoint: `GET /api/v1/health` — returns DB status, Redis status, uptime
- Log all errors with `logger.error()` — include request ID for tracing
- Set up alerts for 5xx error rate spikes
- Monitor response times — API should respond < 200ms for reads

---

## 14. Code Quality Standards

### 14.1 Naming Conventions
| Element | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `ProductGallery.tsx` |
| Files (modules) | camelCase/kebab-case | `product.service.ts`, `use-products.ts` |
| Variables/functions | camelCase | `formatINR()`, `basePrice` |
| Constants | UPPER_SNAKE | `BATCH_SIZE`, `S3_BASE` |
| Interfaces | PascalCase with `I` prefix | `IProduct`, `IApiResponse` |
| Types | PascalCase | `PDPData`, `KitProduct` |
| CSS classes | kebab-case | `product-card`, `sticky-footer` |
| Database fields | camelCase | `basePrice`, `stockStatus` |
| Environment vars | UPPER_SNAKE | `DATABASE_URL`, `JWT_ACCESS_SECRET` |

### 14.2 Code Principles
- **Single Responsibility:** Each function/class does ONE thing
- **DRY:** Don't repeat yourself — extract shared logic
- **KISS:** Keep it simple. Clever code is buggy code
- **YAGNI:** Don't build features nobody asked for
- **Composition over Inheritance:** Use React composition, not class hierarchies
- **Fail Fast:** Validate inputs at the boundary (controller/validator layer)

### 14.3 Code Size Guidelines (Soft Limits)
> **NOTE:** These are industry best practices, NOT strict laws. Do NOT break working code just to meet a line count. Readability and maintainability are more important than strict line limits.

- Functions: **< 50 lines** preferred. If longer, extract helpers. Exception: data mapping functions with many fields can be longer.
- React components: **< 200 lines** preferred. If longer, split into sub-components.
- Files: **< 400 lines** preferred. If longer, split by responsibility.
- **Handling Exceptions:** If splitting a 210-line component makes the code harder to understand because state has to be passed around too much, then **leave it as one file**. Clean, grouped logic > arbitrary line limits.

### 14.4 Comment Standards (Professional, Not Excessive)

Comments should be **meaningful and sparse**. Do NOT comment every line. Follow this exact pattern already used in the codebase:

**① File-level JSDoc** — One per file, at the top. Explains what the file is, its layer, and its responsibilities:
```typescript
/**
 * @fileoverview Product Repository — Database Access Layer
 *
 * Handles all direct MongoDB/Mongoose operations for the Product entity.
 * This is the ONLY layer that should contain database-specific queries.
 *
 * @module modules/product
 * @layer Repository (Data Access)
 */
```

**② Class-level JSDoc** — One per class. Brief purpose:
```typescript
/**
 * @class ProductService
 * @description Core business logic for Products.
 * Coordinates repositories, handles slug generation, price resolution.
 */
```

**③ Method-level JSDoc** — Only on public/complex methods. Use `@param` and `@returns`:
```typescript
/**
 * Retrieves a paginated list of products.
 * @param filters - Query filters (categoryId, etc)
 * @param skip - Number of documents to skip
 * @param limit - Maximum number of documents to return
 * @returns Array of plain product objects
 */
static async findAll(filters, skip, limit) { ... }
```

**④ Inline comments** — ONLY for non-obvious business logic (WHY, not WHAT):
```typescript
// Configurable products with price 0 inherit their first child's price
if (product.productType === "configurable" && price === 0) { ... }
```

**❌ DO NOT comment obvious code:**
```typescript
// BAD — obvious, adds no value
const name = row.name; // Get the product name
const price = parseFloat(row.price); // Parse the price

// GOOD — no comment needed, code is self-explanatory
const name = row.name;
const price = parseFloat(row.price);
```

**Summary: WHERE to comment:**
| Where | Comment? | Type |
|---|---|---|
| Top of every file | ✅ Yes | `@fileoverview` JSDoc |
| Every class | ✅ Yes | `@class` JSDoc |
| Public/complex methods | ✅ Yes | `@param` / `@returns` JSDoc |
| Non-obvious business logic | ✅ Yes | Inline `//` explaining WHY |
| Simple getters/setters | ❌ No | Self-explanatory |
| Variable assignments | ❌ No | Self-explanatory |
| Import statements | ❌ No | Obvious |

---

## 15. Scalability Patterns

### 15.1 Database Indexing
```typescript
// ALWAYS add indexes for frequently queried fields
slug: { type: String, unique: true, index: true }
sku: { type: String, unique: true, index: true }
categoryId: { type: String, index: true }
```

### 15.2 Caching Strategy
| Data | Cache? | TTL | Invalidation |
|---|---|---|---|
| Product list | Yes (Redis) | 5 min | On product create/update/delete |
| Single product | Yes (Redis) | 5 min | On product update |
| Categories | Yes (Redis) | 30 min | On category update |
| User session | JWT + cookies | 15 min / 7 days | On logout |
| Cart | Zustand localStorage | Persistent | On checkout completion |

### 15.3 Pagination
- Default: `page=1, limit=20`
- Max limit: `100` (prevent abuse)
- ALWAYS return `totalCount` and `totalPages`
- Use `skip` + `limit` for simple cases, cursor-based for large datasets

### 15.4 Background Jobs
- Email sending: BullMQ queue (never block API response for emails)
- Image processing: Async (don't block uploads)
- Cron jobs: `node-cron` for periodic tasks (order cleanup, etc.)

---

## 16. Accessibility (a11y)

- All interactive elements MUST have unique `id` attributes
- Images MUST have `alt` text
- Forms MUST have `<label>` elements linked to inputs
- Buttons MUST have descriptive text (not just icons)
- Color contrast: Minimum 4.5:1 ratio for text
- Keyboard navigation: All interactive elements reachable via Tab
- ARIA labels for icon-only buttons: `aria-label="Close menu"`

---

## 17. SEO Checklist

- Every page MUST have a unique `<title>` tag via Next.js `metadata`
- Every page MUST have a `<meta name="description">` tag
- Use single `<h1>` per page with proper heading hierarchy (h1 → h2 → h3)
- Use semantic HTML: `<main>`, `<nav>`, `<article>`, `<section>`, `<aside>`, `<footer>`
- Product pages: Use `metaTitle` and `metaDescription` from database
- Clean URLs: `/products/clan-frml-1-0-formal-biker-shoes` (not `/products?id=123`)
- Images: Use descriptive `alt` text and optimized sizes

---

## 18. Anti-Patterns — What NOT To Do

| ❌ DON'T | ✅ DO |
|---|---|
| `throw new Error("msg")` | `throw new NotFoundError("Product")` |
| `console.log(data)` | `logger.info("Fetched product", { id })` |
| `mongoose.model(...)` in service | Call `ProductRepository.findById()` |
| Business logic in controller | Put it in service layer |
| `fetch()` / new `axios()` in components | Use `apiClient` from `core/api/client.ts` |
| Hardcode URLs, prices, env values | Use `process.env.*` or constants |
| Return all fields from DB | Use `.select()` for public APIs |
| Skip validation | Every endpoint validates via `Validator` + Zod |
| Push to main branch directly | Create PR from feature branch |
| Deploy without testing | Run `pnpm test && pnpm build` first |
| Store passwords in plain text | Use bcrypt (already in auth service) |
| Expose error stack traces | Return `"Internal Server Error"` for unknown errors |
| Create inline styles | Use Tailwind CSS classes |
| Use `any` TypeScript type | Define proper interfaces in `shared-types` |
| Rewrite existing functions | Import and reuse existing code |
| Skip loading/error states | Always handle loading, error, empty, and success states |

---

## 19. File Change Protocol

Before modifying ANY file, follow this checklist:

1. **Read** the existing file completely
2. **Understand** the current patterns and conventions used
3. **Search** the codebase for similar patterns to follow
4. **Plan** your changes — identify exactly what to add/modify
5. **Execute** using targeted edits (not full rewrites)
6. **Verify** the change works and doesn't break existing functionality
7. **Document** — update Swagger docs, comments, and types as needed

---

## 20. Emergency Contacts & Resources

- **Health Check:** `GET /api/v1/health`
- **API Docs:** `GET /api/v1/docs`
- **MongoDB:** Connection string in `backend/.env` → `DATABASE_URL`
- **Redis:** Connection string in `backend/.env` → `REDIS_URL`
- **S3 Bucket:** `store4riders` in `ap-south-2` region
- **Frontend URL:** `http://localhost:3000` (dev), production TBD
- **Backend URL:** `http://localhost:4000` (dev), production TBD
