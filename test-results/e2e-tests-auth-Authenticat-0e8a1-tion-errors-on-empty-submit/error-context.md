# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\tests\auth.spec.ts >> Authentication Flow >> should show validation errors on empty submit
- Location: e2e\tests\auth.spec.ts:19:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Authentication Flow', () => {
  4  |   test('should allow a user to navigate to the login page', async ({ page }) => {
  5  |     // 1. Go to homepage
  6  |     await page.goto('/');
  7  | 
  8  |     // 2. Click on the user icon/login link (Assuming there's a link to /login in MainNav)
  9  |     // For now, we navigate directly
  10 |     await page.goto('/login');
  11 | 
  12 |     // 3. Verify we are on the login page
  13 |     await expect(page.locator('h2')).toContainText('Sign in to your account');
  14 |     await expect(page.locator('input[type="email"]')).toBeVisible();
  15 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  16 |     await expect(page.locator('button[type="submit"]')).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should show validation errors on empty submit', async ({ page }) => {
> 20 |     await page.goto('/login');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  21 |     await page.click('button[type="submit"]');
  22 |     
  23 |     // Zod validation should kick in
  24 |     await expect(page.locator('text=Email is required').first()).toBeVisible();
  25 |   });
  26 | });
  27 | 
```