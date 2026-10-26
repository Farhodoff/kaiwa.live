import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to public pages when unauthenticated', async ({ page }) => {
    // Navigate to Landing Page
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*localhost:\d+\/?$/);

    // Define the public key routes to test
    const publicRoutes = [
      { path: '/pricing', name: 'Pricing Page' },
      { path: '/auth', name: 'Auth Page' },
      { path: '/login', name: 'Login Page' },
    ];

    for (const route of publicRoutes) {
      await page.goto(route.path);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(new RegExp(`.*${route.path}.*`));
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should redirect unauthenticated protected route to landing or auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/.*localhost:\d+(\/(auth.*)?)?$/);
    await expect(page.locator('body')).toBeVisible();
  });
});
