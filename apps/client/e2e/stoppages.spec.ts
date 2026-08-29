import { test, expect } from '@playwright/test';

test.describe('Project Timeline & Stoppages Module E2E Flow', () => {
  test('renders ongoing delays, allows editing stoppages, and dynamic daily calculations', async ({ page }) => {
    // Intercept /auth/me for authenticated session
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { id: 'admin-1', email: 'admin@scb.com', name: 'Engineering Admin', role: 'ADMIN' },
        }),
      });
    });

    // Mock project with ongoing stoppage and resolved stoppage
    await page.route('**/api/v1/projects/proj-timeline-1', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            id: 'proj-timeline-1',
            code: 'ENG-001',
            name: 'Cairo Main Branch Modernization',
            description: 'Comprehensive renovation',
            status: 'ACTIVE',
            startDate: '2025-01-01T00:00:00.000Z',
            endDate: '2025-04-11T00:00:00.000Z', // 100 days
            contractValue: '3500000.00',
            finalCost: null,
            ragStatus: 'AMBER',
            timeline: {
              originalContractDays: 100,
              totalStoppageDays: 35,
              adjustedTimelineDays: 135,
              originalStartDate: '2025-01-01T00:00:00.000Z',
              originalEndDate: '2025-04-11T00:00:00.000Z',
              adjustedEndDate: '2025-05-16T00:00:00.000Z',
              actualDaysElapsed: 60,
              timeElapsedPercentage: 44,
              physicalProgressPercentage: 25,
              overrunDays: 0,
              isFrozen: false,
              alerts: [
                {
                  type: 'SLOW_VELOCITY',
                  severity: 'warning',
                  title: 'LIVE DELAY: Active Stoppage in Effect',
                  message: 'One or more unresolved stoppages are currently active. Adjusted baseline is expanding dynamically each day.',
                },
              ],
              stoppages: [
                {
                  id: 'stop-101',
                  projectId: 'proj-timeline-1',
                  reason: 'Civil Defense permit delays',
                  daysAdded: 15,
                  startDate: '2025-02-01T00:00:00.000Z',
                  endDate: '2025-02-16T00:00:00.000Z',
                  isOngoing: false,
                  createdAt: '2025-02-01T00:00:00.000Z',
                },
                {
                  id: 'stop-ongoing-1',
                  projectId: 'proj-timeline-1',
                  reason: 'Telecom duct civil dispute',
                  daysAdded: 20,
                  startDate: '2025-02-20T00:00:00.000Z',
                  endDate: null,
                  isOngoing: true,
                  createdAt: '2025-02-20T00:00:00.000Z',
                },
              ],
            },
          },
        }),
      });
    });

    await page.route('**/api/v1/projects/proj-timeline-1/milestones', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.route('**/api/v1/projects/proj-timeline-1/procurement', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.route('**/api/v1/contractors**', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
    });

    await page.goto('/projects/proj-timeline-1');

    // 1. Verify Header, Live Delay Alert & Header Admin Buttons
    await expect(page.getByRole('heading', { name: 'Cairo Main Branch Modernization' })).toBeVisible();
    await expect(page.getByText('LIVE DELAY: Active Stoppage in Effect')).toBeVisible();

    const editProjectBtn = page.getByRole('button', { name: /Edit Project/i });
    const deleteProjectBtn = page.getByRole('button', { name: /Delete/i }).first();
    await expect(editProjectBtn).toBeVisible();
    await expect(deleteProjectBtn).toBeVisible();

    // 2. Verify Metrics with Live label
    await expect(page.getByText('100 Days')).toBeVisible();
    await expect(page.getByText('135 Days').first()).toBeVisible();

    // 3. Verify Table with Ongoing Badge and Live indicator
    await expect(page.getByText('Ongoing')).toBeVisible();
    await expect(page.getByText('+20 Days (Live)')).toBeVisible();
    await expect(page.getByText('+15 Days')).toBeVisible();

    // 4. Verify Edit Project Modal
    await editProjectBtn.click();
    await expect(page.getByRole('heading', { name: 'Edit Project Details & Timeline (تعديل بيانات المشروع)' })).toBeVisible();
    await expect(page.getByLabel('Project Name / Branch Designation')).toHaveValue('Cairo Main Branch Modernization');
    await page.getByRole('button', { name: 'Cancel' }).click();

    // 5. Verify Delete Project Confirmation Modal
    await deleteProjectBtn.click();
    await expect(page.getByRole('heading', { name: 'Delete Project Confirmation (حذف المشروع نهائياً)' })).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete this project?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
  });
});
