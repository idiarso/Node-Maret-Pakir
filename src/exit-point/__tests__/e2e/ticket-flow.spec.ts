import { test, expect } from '@playwright/test';

test.describe('Complete Ticket Flow', () => {
  test('should process ticket from scan to gate opening', async ({ page }) => {
    // Step 1: Scan ticket
    await page.goto('/');
    await page.fill('#ticket-input', '123456');
    await page.click('#scan-button');
    
    // Verify ticket details are displayed
    await expect(page.locator('#ticket-details')).toBeVisible();
    await expect(page.locator('#plate-number')).toHaveText('ABC123');
    await expect(page.locator('#entry-time')).toBeVisible();
    
    // Step 2: Complete ticket
    await page.click('#complete-button');
    
    // Verify amount is calculated
    await expect(page.locator('#amount')).toBeVisible();
    await expect(page.locator('#amount')).not.toHaveText('0');
    
    // Step 3: Process payment
    await page.fill('#payment-amount', '5000');
    await page.selectOption('#payment-method', 'cash');
    await page.click('#process-payment');
    
    // Verify payment success
    await expect(page.locator('#payment-success')).toBeVisible();
    
    // Step 4: Print receipt
    await page.click('#print-receipt');
    
    // Verify receipt printed
    await expect(page.locator('#print-success')).toBeVisible();
    
    // Step 5: Open gate
    await page.click('#open-gate');
    
    // Verify gate opened
    await expect(page.locator('#gate-status')).toHaveText('OPEN');
    
    // Step 6: Close gate
    await page.click('#close-gate');
    
    // Verify gate closed
    await expect(page.locator('#gate-status')).toHaveText('CLOSED');
  });

  test('should handle invalid ticket scan', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ticket-input', 'invalid-ticket');
    await page.click('#scan-button');
    
    // Verify error message
    await expect(page.locator('#error-message')).toBeVisible();
    await expect(page.locator('#error-message')).toHaveText('Invalid ticket');
  });

  test('should handle insufficient payment', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ticket-input', '123456');
    await page.click('#scan-button');
    await page.click('#complete-button');
    
    // Try to process payment with insufficient amount
    await page.fill('#payment-amount', '1000');
    await page.selectOption('#payment-method', 'cash');
    await page.click('#process-payment');
    
    // Verify payment error
    await expect(page.locator('#payment-error')).toBeVisible();
    await expect(page.locator('#payment-error')).toHaveText('Insufficient payment');
  });

  test('should handle hardware errors gracefully', async ({ page }) => {
    await page.goto('/');
    await page.fill('#ticket-input', '123456');
    await page.click('#scan-button');
    await page.click('#complete-button');
    
    // Simulate printer error
    await page.route('**/api/tickets/*/print', async route => {
      await route.abort('failed');
    });
    
    await page.click('#print-receipt');
    
    // Verify error handling
    await expect(page.locator('#hardware-error')).toBeVisible();
    await expect(page.locator('#hardware-error')).toHaveText('Printer error');
  });
}); 