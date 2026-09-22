import { test, expect } from '@playwright/test';

test.describe('Catalog Page - Filters and Sorting', () => {
  test('should display and apply category filters', async ({ page }) => {
    await page.goto('/products');
    
    // Check if category filter exists
    const categoryLink = page.locator('button', { hasText: 'Helmets' });
    await expect(categoryLink).toBeVisible();
    
    // Click and expect URL to change
    await categoryLink.click();
    await expect(page).toHaveURL(/.*category=helmets/);
    
    // Check if clear button appears in badges
    const clearButton = page.locator('.bg-orange-50', { hasText: 'Helmets' }).locator('button');
    await expect(clearButton).toBeVisible();
    await clearButton.click();
    await expect(page).not.toHaveURL(/.*category=helmets/);
  });

  test('should apply multi-select size filters', async ({ page }) => {
    await page.goto('/products');
    
    const sizeL = page.locator('button', { hasText: /^L$/ });
    const sizeXL = page.locator('button', { hasText: /^XL$/ });
    
    await sizeL.click();
    await expect(page).toHaveURL(/.*size=L/);
    
    await sizeXL.click();
    // Using string matching since comma order might vary depending on framework, but we appended it.
    await expect(page).toHaveURL(/.*size=L%2CXL/);
    
    // Check badge rendering
    await expect(page.locator('.bg-orange-50', { hasText: 'Size: L' })).toBeVisible();
    await expect(page.locator('.bg-orange-50', { hasText: 'Size: XL' })).toBeVisible();
  });

  test('should apply sorting changes', async ({ page }) => {
    await page.goto('/products');
    
    const sortDropdown = page.locator('#catalog-sort');
    await expect(sortDropdown).toBeVisible();
    
    await sortDropdown.selectOption('bestselling');
    await expect(page).toHaveURL(/.*sort=bestselling/);

    await sortDropdown.selectOption('rating');
    await expect(page).toHaveURL(/.*sort=rating/);
  });

  test('should apply colour filters via swatches and clear them', async ({ page }) => {
    await page.goto('/products');
    
    // Find the colour swatch for Black (title="Black")
    const blackSwatch = page.locator('button[title="Black"]');
    await blackSwatch.click();
    await expect(page).toHaveURL(/.*colour=Black/);
    
    // Find the colour swatch for Red (title="Red")
    const redSwatch = page.locator('button[title="Red"]');
    await redSwatch.click();
    await expect(page).toHaveURL(/.*colour=Black%2CRed/); // Multi-select validation
    
    // Check if badges are visible
    const blackBadgeClear = page.locator('.bg-orange-50', { hasText: 'Black' }).locator('button');
    await expect(blackBadgeClear).toBeVisible();
    
    // Clear individual colour badge
    await blackBadgeClear.click();
    await expect(page).toHaveURL(/.*colour=Red/); // Black is removed
  });

  test('should handle empty or malformed URL states safely', async ({ page }) => {
    // Injecting malicious or unformatted strings in URL to test app stability (it shouldn't crash the UI)
    await page.goto('/products?size=,,,+++&colour=(.*)+');
    
    // Page should still load the filter sidebar without React crashing
    await expect(page.locator('text=Rider Size')).toBeVisible();
    await expect(page.locator('text=Colours')).toBeVisible();
  });
});
