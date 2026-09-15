import { test, expect } from '@playwright/test';

test.describe('/auth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should load the login screen correctly.', async ({ page }) => {
    await expect(page.locator('[data-testid="username-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-btn"]')).toBeDisabled();
  });
});