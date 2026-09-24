# Store4Riders - Project Architecture & Deployment Guide

Welcome to the Store4Riders project! This document explains the technical architecture, how to run the project, and strict guidelines for deployment (like setting up on a VPS or Vercel).

---

## 1. System Architecture

This project uses a **Monorepo** structure powered by **Turborepo** and **PNPM workspaces**. It is separated into two distinct applications for maximum scalability and security:

1. **Backend (`/backend`) - Port 4000**
   - **Role:** Pure RESTful API Server.
   - **Framework:** Next.js API Routes (Server-side ONLY, no UI).
   - **Pattern:** Strict Domain-Driven Design (Route → Controller → Service → Repository → Model).
   - **Database:** MongoDB Atlas (via Mongoose).
   - **Cache & Rate Limiting:** Redis.
   - **Responsibility:** All business logic, checkout calculations, validations, and database interactions happen here. The backend NEVER renders UI.

2. **Frontend (`/frontend`) - Port 3000**
   - **Role:** Client-facing E-commerce UI.
   - **Framework:** Next.js 15 (App Router).
   - **State Management:** Zustand (Client) + TanStack React Query (Server-state/API calls).
   - **Styling:** Tailwind CSS.
   - **Responsibility:** Strictly renders the UI. It relies completely on the backend API for data, pagination, and logic.

---

## 2. Environment Variables (.env)

> **⚠️ CRITICAL: Fail-Fast Architecture**
> The backend environment variables are strictly validated at startup. If any critical variable is missing in production, the server will **CRASH IMMEDIATELY** and refuse to start. There are NO fallback default values in production for security reasons.

You must create a `.env` file in your VPS or add these to your hosting dashboard (e.g., Vercel):

```env
# --- DATABASE & CACHE ---
DATABASE_URL=mongodb+srv://<user>:<password>@cluster.mongodb.net/store4riders
REDIS_URL=redis://localhost:6379

# --- URLS ---
FRONTEND_URL=https://store4rider.com

# --- SECURITY (Must be long random strings) ---
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
NODE_ENV=production

# --- PAYMENT (PayU & CCAvenue) ---
PAYU_MERCHANT_KEY=your_payu_key
PAYU_SALT=your_payu_salt
CCAVENUE_MERCHANT_ID=your_ccavenue_mid
CCAVENUE_ACCESS_CODE=your_ccavenue_access
CCAVENUE_WORKING_KEY=your_ccavenue_working

# --- AWS S3 (For Images) ---
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-2
AWS_S3_BUCKET=store4riders
```

---

## 3. Image Storage (AWS S3)

To ensure the application is scalable and can be hosted on serverless environments (like Vercel) or load-balanced VPS instances, **local disk uploads are disabled**. 
All product images and user uploads are securely pre-signed and uploaded directly to **AWS S3**. 

If you are migrating old data that uses local `/uploads/` paths, you must run the database sync script to convert them to S3 URLs:
```bash
cd backend
npx tsx src/scripts/fix-products.ts
```

---

## 4. Deployment Instructions (VPS)

If you are hosting this on a VPS (e.g., Hostinger, AWS EC2, DigitalOcean) instead of Vercel, follow these steps to run the app natively using PM2 and Nginx.

### Step 1: Install Dependencies
```bash
# Install Node.js (v24+) and PNPM
npm install -g pnpm pm2
pnpm install
```

### Step 2: Build the Monorepo
```bash
# This builds both frontend and backend packages
pnpm build
```

### Step 3: Run with PM2
Start both applications in the background:
```bash
# Start Backend on port 4000
cd backend
pm2 start pnpm --name "s4r-backend" -- start

# Start Frontend on port 3000
cd ../frontend
pm2 start pnpm --name "s4r-frontend" -- start
```

### Step 4: Configure Nginx (Reverse Proxy)
Map your domains to the respective local ports. Example configuration:

```nginx
# Frontend (store4rider.com -> Port 3000)
server {
    server_name store4rider.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Backend API (api.store4rider.com -> Port 4000)
server {
    server_name api.store4rider.com;
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. API Documentation (Swagger/Scalar)

The backend provides interactive API documentation for frontend developers or third-party integrations. It is automatically generated from the OpenAPI specifications in the codebase.

- **Swagger UI:** Accessible at `http://localhost:4000/docs` (or `https://api.store4rider.com/docs` in production).
- **Modern Scalar UI:** Accessible at `http://localhost:4000/docs/ai`.
- **Raw OpenAPI JSON:** Accessible at `http://localhost:4000/api/docs`.

> Note: The API docs UI is the *only* user interface rendered by the backend. It is strictly for developer use.

---

## 6. Frontend Pages Map (For Clients & Developers)

Since Next.js uses file-based routing, every folder inside `frontend/app/` represents a live URL on your website. Here is the current map of the application:

**Shopping & Browsing**
- `/` - Homepage
- `/products` - Product Catalog / Listing
- `/products/[slug]` - Single Product Details
- `/sale` - Discounted Items

**Checkout Flow**
- `/cart` - Shopping Cart
- `/checkout` - Secure Checkout & Payment

**User Account**
- `/login` & `/register` - Authentication
- `/account` - User Dashboard / Order History

**Legal & Support**
- `/privacy`, `/terms`, `/shipping`, `/warranty`, `/returns` - Policy Pages
- `/support`, `/care`, `/insurance` - Customer Help

*Developer Tip:* To create a new page like `www.store4rider.com/about`, simply create a folder `frontend/app/about/` and add a `page.tsx` file inside it!

---

## 7. Coding Standards & Maintenance

If future developers need to maintain this code:
- Check `.agents/rules/CODING_STANDARDS.md` before writing code.
- Keep UI components small (under 200 lines). Avoid monolithic files.
- Never write business logic in the frontend `app/` directory. All logic must route through the `backend/src/modules` layer.
