import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control E2E Flows', () => {
  test('renders the Suez Canal Bank login page with enterprise branding', async ({ page }) => {
    await page.goto('/login');

    await expect(page).toHaveTitle(/Suez Canal Bank/);
    await expect(page.getByRole('heading', { name: 'Sign In to EPCMS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Suez Canal Bank' })).toBeVisible();
    await expect(page.getByText('Demo Accounts (Instant Fill):')).toBeVisible();
  });

  test('validates required fields with Zod client-side validation', async ({ page }) => {
    await page.goto('/login');

    // Attempt to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Verify inputs trigger validation requirements
    const emailInput = page.getByLabel('Corporate Email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('fills admin demo credentials when Admin Role button is clicked', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /Admin Role/i }).click();

    const emailInput = page.getByLabel('Corporate Email');
    await expect(emailInput).toHaveValue('admin@scb.com');
  });

  test('redirects unauthenticated users trying to access dashboard directly to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });
});
