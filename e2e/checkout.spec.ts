import { test, expect } from '@playwright/test';

test.describe('Step 12: Checkout UI Edge Cases (Scenarios 5 & 6)', () => {

  test('Scenario 5: Double click on Pay button disables button and prevents duplicate API calls', async ({ page }) => {
    // Navigate to checkout
    await page.goto('/checkout');

    // Assuming the user has items in cart and filled the address...
    // We mock the backend order creation API to artificially delay it by 2 seconds
    // so we have time to double click
    let apiCallCount = 0;
    await page.route('**/api/v1/orders', async (route) => {
      if (route.request().method() === 'POST') {
        apiCallCount++;
        // Delay response to simulate network wait
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { orderId: 'ord_123', gatewayOrderId: 'txn_123' }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock PayU redirection to prevent actual navigation
    await page.route('https://test.payu.in/_payment', route => {
      route.fulfill({ status: 200, body: '<html>PayU Mock Page</html>' });
    });

    // Find the Pay button
    const payButton = page.locator('button:has-text("Place Order")'); // Adjust text to match actual button

    // Trigger double click (fast sequential clicks)
    await payButton.click();
    await payButton.click({ force: true }); 
    await payButton.click({ force: true }); // Even triple click!

    // The button should immediately become disabled
    await expect(payButton).toBeDisabled();
    
    // Wait for the mocked API delay to finish
    await page.waitForTimeout(2500);

    // CRITICAL CHECK: Even though we clicked 3 times, the API should only be called ONCE
    expect(apiCallCount).toBe(1);
  });

  test('Scenario 6: Browser refresh after payment redirects properly based on status', async ({ page }) => {
    // This scenario tests if a user pays, lands on the callback page, and refreshes the browser.
    
    // 1. User lands on callback page with success params
    await page.goto('/checkout/callback?status=success&orderId=txn_123');

    // 2. The UI should show "Payment Successful"
    await expect(page.locator('text=Payment Successful')).toBeVisible();

    // 3. User hits F5 (Browser Refresh)
    await page.reload();

    // 4. The page should still robustly show the success state because it reads from the URL / backend
    await expect(page.locator('text=Payment Successful')).toBeVisible();
    
    // Check if cart is cleared (Local Storage check or API check)
    // Normally Zustand cart state is reset, we can verify empty cart icon or similar.
  });

});
