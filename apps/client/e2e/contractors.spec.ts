import { test, expect } from '@playwright/test';

test.describe('Contractor Performance Scorecards E2E Tests', () => {
  test('renders contractor scorecard grid with the 6 mandatory sub-scores and overall score', async ({ page }) => {
    // Intercept auth
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { id: 'admin-1', email: 'admin@scb.com', name: 'Admin', role: 'ADMIN' },
        }),
      });
    });

    await page.route('**/api/v1/projects**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ data: [], meta: { total: 0 } }),
      });
    });

    // Mock contractor scores
    await page.route('**/api/v1/contractors**', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          data: [
            {
              id: 'c-1',
              contractorName: 'Arab Contractors (Osman Ahmed Osman & Co.)',
              projectId: 'p-1',
              schedule: 85,
              quality: 90,
              resources: 80,
              safety: 95,
              coordination: 88,
              docs: 82,
              overallScore: 86.7,
            },
          ],
          meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
        }),
      });
    });

    await page.goto('/contractors');

    // Verify header and scorecard
    await expect(page.getByRole('heading', { name: 'Contractor & Consultant Performance Scorecards' })).toBeVisible();
    await expect(page.getByText('Arab Contractors (Osman Ahmed Osman & Co.)')).toBeVisible();

    // Verify all 6 sub-score labels are visible
    await expect(page.getByText('1. Schedule Adherence')).toBeVisible();
    await expect(page.getByText('2. Quality of Work')).toBeVisible();
    await expect(page.getByText('3. Resource Adequacy')).toBeVisible();
    await expect(page.getByText('4. Safety & HSE Compliance')).toBeVisible();
    await expect(page.getByText('5. Site Coordination')).toBeVisible();
    await expect(page.getByText('6. Documentation & Submittals')).toBeVisible();

    // Verify overall score badge
    await expect(page.getByText('86.7 / 100').first()).toBeVisible();
  });
});
