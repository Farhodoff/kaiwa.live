import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`N4 lessons remain accessible and return to N4 at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/jlpt?level=n4');
    await page.getByRole('button', { name: /26-Dars.*darsni boshlash/i }).click();
    await expect(page).toHaveURL(/\/lesson\/ja-minna-l26$/);
    await expect(page.getByRole('heading', { name: /26-Dars/ }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Chiqish' }).click();
    await expect(page).toHaveURL(/\/jlpt\?level=n4/);
    await expect(page.getByRole('button', { name: /26-Dars.*darsni boshlash/i })).toBeVisible();
    await page.getByLabel('Dars yoki grammatikani qidirish').fill('50');
    await page.getByRole('button', { name: /50-Dars.*darsni boshlash/i }).click();
    await expect(page).toHaveURL(/\/lesson\/ja-minna-l50$/);
    await expect(page.getByRole('heading', { name: /50-Dars/ }).first()).toBeVisible();
  });
}

test('search finds grammar and gives a way to clear empty filters', async ({ page }) => {
  await page.goto('/jlpt?level=n4');
  const search = page.getByLabel('Dars yoki grammatikani qidirish');
  await search.fill('いただけませんか');
  await expect(page.getByRole('button', { name: /26-Dars.*darsni boshlash/i })).toBeVisible();
  await search.fill('topilmaydigan-mavzu-123');
  await expect(page.getByText("Qidiruvingiz bo'yicha darslar topilmadi.")).toBeVisible();
  await page.getByRole('button', { name: 'Filtrlarni tozalash' }).click();
  await expect(page.getByRole('button', { name: /26-Dars.*darsni boshlash/i })).toBeVisible();
});

test('N4 listening opens directly without showing the audio transcript', async ({ page }) => {
  await page.goto('/jlpt?level=n4');
  await page.getByRole('button', { name: /26-Dars.*tinglash mashqi/i }).click();
  await expect(page).toHaveURL(/\/lesson\/ja-minna-l26\?step=mondai/);
  await expect(page.getByRole('button', { name: 'Ovozni tinglash' })).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByText('どうして 遅れたんですか。')).not.toBeVisible();
});

test('a learner can open the N3 course and its first lesson', async ({ page }) => {
  await page.goto('/jlpt?level=n3');
  await page.getByRole('button', { name: /^Passive Voice.*darsni boshlash/i }).click();
  await expect(page).toHaveURL(/\/lesson\/ja-n3-u1-l1$/);
  await expect(page.getByRole('heading', { level: 1, name: /Passive Voice/ })).toBeVisible();
  await page.getByRole('button', { name: 'Chiqish' }).click();
  await expect(page).toHaveURL(/\/jlpt\?level=n3/);
});
