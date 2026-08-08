import { expect, test } from '@playwright/test';

test('phase0 launch — menu principal charge', async ({ page }) => {
  const response = await page.goto('/');

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/blood relay/i);
  await expect(page.locator('canvas')).toBeVisible({ timeout: 5000 });
});
