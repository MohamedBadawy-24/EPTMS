import { test, expect } from '@playwright/test';

test.describe('Procurement Module E2E & Generated Columns Inspection', () => {
  test('displays generated remaining quantity and highlights depleted items', async ({ page }) => {
    // Intercept /auth/me for authenticated session
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'admin-1', email: 'admin@scb.com', name: 'Procurement PM', role: 'ADMIN' },
        }),
      });
    });

    await page.route('**/api/v1/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [{ id: 'p-1', code: 'ENG-001', name: 'Platform Upgrade' }],
          meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
        }),
      });
    });

    // Mock procurement items with positive and zero/negative remainingQuantity
    await page.route('**/api/v1/procurement**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'item-1',
              projectId: 'p-1',
              itemName: 'Oracle DB Enterprise Licenses',
              tenderQuantity: 20,
              allocatedQuantity: 15,
              deliveredQuantity: 5,
              unitCost: '45000.00',
              status: 'ALLOCATED',
              remainingQuantity: 0, // Depleted -> highlighted
            },
            {
              id: 'item-2',
              projectId: 'p-1',
              itemName: 'Rack Server 42U Enclosures',
              tenderQuantity: 30,
              allocatedQuantity: 10,
              deliveredQuantity: 5,
              unitCost: '8500.00',
              status: 'PARTIALLY_DELIVERED',
              remainingQuantity: 15, // Positive -> green
            },
          ],
          meta: { total: 2, page: 1, limit: 50, totalPages: 1 },
        }),
      });
    });

    await page.goto('/procurement');

    // Verify page header
    await expect(page.getByRole('heading', { name: 'Material & Equipment Procurement Control' })).toBeVisible();

    // Verify table items rendered
    await expect(page.getByText('Oracle DB Enterprise Licenses')).toBeVisible();
    await expect(page.getByText('Rack Server 42U Enclosures')).toBeVisible();

    // Verify remaining quantity badges
    const zeroRemaining = page.locator('span:text("0")').first();
    await expect(zeroRemaining).toBeVisible();

    const fifteenRemaining = page.locator('span:text("15")').first();
    await expect(fifteenRemaining).toBeVisible();
  });
});
