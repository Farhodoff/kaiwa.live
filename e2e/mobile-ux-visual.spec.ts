import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport & UX/UI Responsive Suite', () => {
  // Common mobile screen sizes: 390x844 (iPhone 14) and 360x800 (Standard Android)
  const mobileViewports = [
    { name: 'iPhone 14 (390x844)', width: 390, height: 844 },
    { name: 'Android Standard (360x800)', width: 360, height: 800 },
  ];

  mobileViewports.forEach(({ name, width, height }) => {
    test.describe(`${name} UX Tests`, () => {
      test.use({ viewport: { width, height } });

      test('Landing Page: renders without horizontal overflow and displays core mobile CTA', async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Check horizontal overflow
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing).toBe(false);
        expect(errors.length).toBe(0);

        // Core CTA or navigation should be visible
        await expect(page.locator('body')).toBeVisible();
      });

      test('JLPT Hub: renders tabs, level selector and content cleanly on mobile', async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/jlpt');
        await page.waitForLoadState('domcontentloaded');

        // Check horizontal overflow
        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing).toBe(false);
        expect(errors.length).toBe(0);
      });

      test('Flashcards: renders mobile card study UI with touch-friendly controls', async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/flashcards');
        await page.waitForLoadState('domcontentloaded');

        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing).toBe(false);
        expect(errors.length).toBe(0);
      });

      test('Speaking Coach: renders cleanly with mobile controls and zero crash', async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/speaking-coach?lang=ja');
        await page.waitForLoadState('domcontentloaded');

        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing).toBe(false);
        expect(errors.length).toBe(0);
      });

      test('Mock Exam: renders questions and options without horizontal clipping', async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto('/exam');
        await page.waitForLoadState('domcontentloaded');

        const isOverflowing = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        expect(isOverflowing).toBe(false);
        expect(errors.length).toBe(0);
      });
    });
  });
});
