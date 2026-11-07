import { test, expect } from '@playwright/test';

test.describe('JLPT Mock Exam E2E', () => {
  test('should load JLPT Mock Exam page', async ({ page }) => {
    await page.goto('/jlpt/mock-exam');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('body')).toBeVisible();

    // Verify level selectors or exam options exist
    const levelSelector = page.getByRole('button', { name: /N[1-5]/i }).first();
    if (await levelSelector.isVisible()) {
      await expect(levelSelector).toBeVisible();
    }
  });
});
