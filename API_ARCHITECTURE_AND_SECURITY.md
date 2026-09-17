# Store4Riders - Architectural & Security Justification Document

This document is intended for the Client, CTOs, and Security Auditors. It explains the "Why" behind the technical decisions made in the Store4Riders Backend API, detailing how it works and why these specific patterns were chosen to ensure enterprise-level security and scalability.

---

## 1. Why use Domain-Driven Design (DDD) in the Backend?
**What we did:** The backend code is split into strict layers: `Routes` → `Validators` → `Controllers` → `Services` → `Repositories`.
**Why this is the best approach:**
- **Separation of Concerns:** A traditional "monolithic" API writes database queries and business logic inside the same routing file. By separating them, if you ever decide to change the database (e.g., from MongoDB to PostgreSQL), you only change the `Repository` layer. The business logic (`Service`) remains untouched.
- **Testability:** It is extremely easy to write unit tests for the `Service` layer without needing a live database, saving time and money in QA.

---

## 2. Why use Zod for API Validation?
**What we did:** Every single API endpoint passes incoming data through a strict `Zod` validation schema before it reaches the database.
**Why this is the best approach:**
- **NoSQL Injection Prevention:** Hackers often try to send malicious MongoDB query operators (like `{"$gt": ""}`) in JSON payloads to bypass passwords. Zod strictly strips out undocumented fields and forces type-checking (e.g., ensuring a price is a Number, not an Object).
- **Fail-Fast:** Invalid data is rejected with a clean `400 Bad Request` instantly, saving server processing power and preventing corrupted data from entering the database.

---

## 3. How is the System Secured Against Attacks? (Security Layers)

### A. Rate Limiting with Redis
**How it works:** We implemented a centralized `RateLimiter` using Redis (in memory cache).
**Why it is secure:** 
- It tracks the IP address of every user. If a bot tries to brute-force the `/login` endpoint, or a competitor tries to scrape all products, the Redis limiter will block their IP with a `429 Too Many Requests` error. 
- Why Redis and not local memory? If the application scales to 5 servers, local memory limiters fail. Redis acts as a single source of truth across all servers.

### B. Authentication & Token Security
**How it works:** We use JSON Web Tokens (JWT) for authentication. 
**Why it is secure:**
- We strictly avoid storing sensitive tokens in `localStorage` (which is highly vulnerable to Cross-Site Scripting / XSS attacks). 
- Access tokens have short lifespans (15 minutes), meaning if a token is intercepted, it becomes useless quickly.

### C. Security Headers & CORS
**How it works:** Global middleware applies strict CORS (Cross-Origin Resource Sharing) policies and HTTP Security Headers.
**Why it is secure:** The backend explicitly rejects requests coming from unrecognized websites. It also prevents "Clickjacking" and "MIME-sniffing" by applying headers like `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`.

---

## 4. Why use AWS S3 for Images instead of Local Server Storage?
**What we did:** Product and user images are uploaded directly to Amazon S3 via Secure Pre-Signed URLs.
**Why this is the best approach:**
- **Serverless & Scalable:** If you host the backend on Vercel or AWS Lambda, the local disk is wiped clean every few minutes. S3 ensures files are permanent.
- **Security:** We do not allow the user to send images *through* our backend API (which could crash the server with huge files). Instead, the backend generates a "Pre-Signed URL" (a temporary 60-second ticket). The client's browser uploads the file directly to S3 using that ticket. This takes the load completely off your servers.

---

## 5. Why Next.js (TypeScript) for the Backend?
**What we did:** We used Next.js API Routes (Node.js/TypeScript) for the backend instead of traditional Express, Python, or PHP.
**Why this is the best approach:**
- **Universal Codebase:** Both the frontend and backend are written in TypeScript. Developers can share "Types" and "Interfaces" between frontend and backend. If a database field changes from `price` to `basePrice`, TypeScript immediately throws a warning on the frontend, preventing production bugs.
- **Cloud-Native:** Next.js APIs are natively designed to run on Edge Networks and Serverless functions, making the infrastructure cheaper to run and faster to scale compared to traditional heavy servers.

---
**Summary for the Client:** 
This architecture was explicitly chosen to act like a fortress. It is designed so that as Store4Riders grows from 100 users to 100,000 users, the codebase does not need to be rewritten. The security layers handle modern web threats automatically, while the DDD structure allows developers to easily plug in new features without breaking existing ones.
