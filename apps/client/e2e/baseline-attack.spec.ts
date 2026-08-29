import { test, expect } from '@playwright/test';

test.describe('Baseline Immutability UI Resistance (Layer 1 Attack Resistance)', () => {
  test('explicitly verifies that baselineDate input field DOES NOT EXIST in the Edit Milestone DOM', async ({ page }) => {
    // Intercept /auth/me to mock authenticated admin session
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-admin-id',
            email: 'admin@scb.com',
            name: 'Security Admin',
            role: 'ADMIN',
          },
        }),
      });
    });

    // Mock project detail and milestones
    await page.route('**/api/v1/projects/mock-proj-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-proj-1',
            code: 'ENG-001',
            name: 'Core Banking Platform Upgrade',
            status: 'ACTIVE',
            startDate: '2025-01-15T00:00:00.000Z',
            endDate: '2026-06-30T00:00:00.000Z',
            contractValue: '4500000.00',
            finalCost: null,
            ragStatus: 'GREEN',
          },
        }),
      });
    });

    await page.route('**/api/v1/projects/mock-proj-1/milestones', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'milestone-101',
              projectId: 'mock-proj-1',
              name: 'Requirements Finalized',
              baselineDate: '2025-03-01T00:00:00.000Z',
              forecastDate: '2025-03-05T00:00:00.000Z',
              actualDate: null,
              status: 'IN_PROGRESS',
              delayDays: 4,
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/projects/mock-proj-1/procurement', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.route('**/api/v1/contractors**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });

    // Navigate to Project Detail
    await page.goto('/projects/mock-proj-1');

    // Verify Project Schedule tab is visible
    await expect(page.getByRole('heading', { name: 'Core Banking Platform Upgrade' })).toBeVisible();
    await expect(page.getByText('Requirements Finalized')).toBeVisible();

    // Click Edit Milestone button
    const editButton = page.locator('button[title*="Edit milestone"]').first();
    await editButton.click();

    // Modal appears
    await expect(page.getByRole('heading', { name: 'Update Milestone Schedule' })).toBeVisible();

    // Verify Read-Only Baseline Banner is visible
    await expect(page.getByText('Committed Baseline Date (Locked)')).toBeVisible();
    await expect(page.getByText('Immutable')).toBeVisible();

    // ─── CRITICAL INVARIANT TEST ─────────────────────────────────────────────
    // Verify that NO editable input field exists for baselineDate
    const baselineDateInput = page.locator('input[name="baselineDate"]');
    await expect(baselineDateInput).toHaveCount(0);

    const anyEditableBaseline = page.locator('input[type="date"][id*="baseline"]');
    await expect(anyEditableBaseline).toHaveCount(0);

    // Only forecastDate and actualDate date inputs must exist
    const forecastInput = page.getByLabel('Forecast / Revised Date');
    await expect(forecastInput).toBeVisible();

    const actualInput = page.getByLabel('Actual Completion Date (If Finished)');
    await expect(actualInput).toBeVisible();
  });
});
