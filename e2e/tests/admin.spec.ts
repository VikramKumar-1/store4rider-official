import { test, expect } from '@playwright/test';

test.describe('Admin Portal E2E', () => {

  test('should display dedicated admin login at /admin when unauthenticated', async ({ page }) => {
    // 1. Navigate directly to /admin
    await page.goto('http://localhost:3000/admin');

    // 2. Wait for the AdminLogin component to render
    await expect(page.locator('text=Admin Portal')).toBeVisible();

    // 3. Ensure the login fields are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('Secure Login');
  });

  test('should login as admin and view dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/admin');

    // Use environment variables if available, otherwise default to the standard bypass
    const adminEmail = process.env.ADMIN_BYPASS_EMAIL || 'admin@store4riders.com';
    const adminPassword = process.env.ADMIN_BYPASS_PASSWORD || 'admin';

    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    
    await page.click('button[type="submit"]');

    // Wait for redirect to Dashboard
    await expect(page.locator('text=Dashboard Overview')).toBeVisible({ timeout: 10000 });

    // Check if the KPI cards rendered
    await expect(page.locator('text=Total Revenue')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
    
    // Check if the sidebar is rendered
    await expect(page.locator('aside')).toBeVisible();
    
    // The Dashboard link should be highlighted (has bg-brand class)
    const dashboardLink = page.locator('nav a', { hasText: 'Dashboard' });
    await expect(dashboardLink).toHaveClass(/bg-brand/);
    
    // Click on Users tab instead of Products (since Products is Phase 2)
    await page.locator('nav a', { hasText: 'Users' }).click();
    
    // Users tab should now have the bg-brand class
    const usersLink = page.locator('nav a', { hasText: 'Users' });
    await expect(usersLink).toHaveClass(/bg-brand/);
  });

});
