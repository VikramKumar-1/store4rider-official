# Phase 2: QA & Test Report

This document serves as a formal test tracking record for **Phase 2 (Product & Catalog Enhancement)**. It details the business logic flows, scenarios tested, and current status, helping maintain a clear history of what was verified in our Vitest test suites.

---

## 1. Bestseller & Order Webhook Tracking
**Location:** `backend/src/modules/order/__tests__/order.service.test.ts`
**Objective:** Ensure product sales are accurately tracked to power the "Bestselling" filter in the store.

### Tested Flows & Edge Cases
- **Trigger:** Razorpay webhook sends `payment.captured` event to our backend.
- **Action 1 (Order Status):** System searches for the Razorpay Order ID and changes its status from `pending` to `paid`.
- **Action 2 (Inventory):** System reads the items in the order and decreases (`decrementStock`) their inventory by the purchased quantity.
- **Action 3 (Sales Tracking):** System increases (`incrementSalesCount`) the sales count for each purchased product by the purchased quantity.
- **Edge Case (Idempotency):** Tests ensure that if the webhook is sent twice for the same order, the system ignores the second request (no double-counting of sales or double-decrementing stock).

**Status:** ✅ Passed

---

## 2. API Product Sorting & Filtering
**Location:** `backend/src/modules/product/__tests__/product.validator.test.ts`
**Objective:** Ensure the backend correctly interprets frontend query parameters (like sorting and stock filters) and converts them into safe MongoDB queries.

### Tested Flows & Edge Cases
- **Bestselling Sort:** User requests `?sort=bestselling`. 
  - *Expected:* Backend translates this to `{ salesCount: -1 }` (highest sales first).
- **Newest Sort:** User requests `?sort=newest`.
  - *Expected:* Backend translates this to `{ createdAt: -1 }` (newest first).
- **In-Stock Filter:** User toggles "In Stock Only" (`?inStock=true`).
  - *Expected:* Backend safely adds `{ stockStatus: { $gt: 0 } }` to the DB query, avoiding NoSQL injection.
- **Price Range Filter:** User sets price slider `?minPrice=500&maxPrice=1000`.
  - *Expected:* Backend properly creates a MongoDB `$gte` and `$lte` range query for `basePrice`.

**Status:** ✅ Passed

---

## 3. Category Hierarchical Tree Generation
**Location:** `backend/src/modules/category/__tests__/category.service.test.ts`
**Objective:** The database stores categories as a flat list (e.g., Helmets, Jackets). We need to build a Parent-Child tree for the frontend Admin UI and Catalog menus efficiently.

### Tested Flows & Edge Cases
- **Tree Construction:** Backend fetches flat categories. If category 'Full Face' has `parentId` pointing to 'Helmets', it correctly nests 'Full Face' inside the 'Helmets' children array.
- **Caching Strategy (Performance):** Building the tree takes computation.
  - *First load:* System builds the tree and saves it to Redis memory.
  - *Second load:* System fetches instantly from Redis without hitting MongoDB. Tests explicitly verify MongoDB is NOT called on the second request.
- **Cache Invalidation:** Admin creates, updates, or deletes a category.
  - *Expected:* System automatically clears the Redis cache (`deleteCache('category_tree')`) so the next user sees the updated menu immediately.

**Status:** ✅ Passed

---

## 4. Custom Error Handling Format
**Location:** `backend/src/core/errors/AppError.test.ts`
**Objective:** Guarantee that our APIs never leak raw server errors (stack traces) to the frontend, and always return a predictable format for `toast.error()`.

### Tested Flows & Edge Cases
- **Not Found (404):** A user navigates to a non-existent product or category.
  - *Expected:* System throws `NotFoundError` and formats the message exactly as `<Resource> not found` with HTTP 404.
- **Validation (400):** A user submits a form with missing fields.
  - *Expected:* System throws `ValidationError` with HTTP 400.

**Status:** ✅ Passed

---

## 5. Manual UI Checklist (Pending Your Review)
While the backend logic is 100% covered by automated tests, the frontend UI requires manual visual confirmation. 

- [ ] **Category Admin:** Visit `/admin/categories`. Can you see the tree structure? Can you click 'Add' and 'Edit'?
- [ ] **Category Landing Page:** Visit `/products?category=helmets`. Does the category banner image and description appear at the top of the grid?
- [ ] **Recently Viewed:** View a product (e.g., `/products/shoe-1`), then view another. Scroll to the bottom of the second product page—does the first product appear in the "Recently Viewed" slider?

*Note: Once you manually verify these 3 visual items in your browser, Phase 2 is completely validated.*
