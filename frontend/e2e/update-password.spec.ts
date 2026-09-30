import { test, expect } from '@playwright/test';

test.describe('/auth/update-password', () => {
  test('should load the update password screen correctly.', async ({ page }) => {
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mustChangePassword: true }),
      });
    });
    await page.goto('/auth/update-password');

    await expect(page.locator('[data-testid="password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirm-password-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-btn"]')).toBeDisabled();
  });

  test('should enable submit button when valid matching passwords are entered.', async ({ page }) => {
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mustChangePassword: true }),
      });
    });
    await page.goto('/auth/update-password');

    const submitBtn = page.locator('[data-testid="submit-btn"]');
    await expect(submitBtn).toBeDisabled();

    await page.locator('[data-testid="password-input"]').fill('nova_senha_123');
    await page.locator('[data-testid="confirm-password-input"]').fill('nova_senha_123');

    await expect(submitBtn).toBeEnabled();
  });

  test('should show validation error when password length is less than 8 characters.', async ({ page }) => {
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mustChangePassword: true }),
      });
    });
    await page.goto('/auth/update-password');

    const passwordInput = page.locator('[data-testid="password-input"]');
    await passwordInput.fill('123456');
    await passwordInput.blur();

    const inputError = page.locator('[data-testid="password-error"]');
    await expect(inputError).toBeVisible();
    await expect(inputError).toHaveText('Senha inválida (mínimo de 8 caracteres)');
  });

  test('should show validation error when passwords do not match.', async ({ page }) => {
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mustChangePassword: true }),
      });
    });
    await page.goto('/auth/update-password');

    await page.locator('[data-testid="password-input"]').fill('nova_senha_123');
    const confirmPasswordInput = page.locator('[data-testid="confirm-password-input"]');
    
    await confirmPasswordInput.fill('senha_diferente');
    await confirmPasswordInput.blur();

    const inputError = page.locator('[data-testid="confirm-password-error"]');
    await expect(inputError).toBeVisible();
    await expect(inputError).toHaveText('As senhas não coincidem');
    
    const submitBtn = page.locator('[data-testid="submit-btn"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('should update password successfully and redirect to overview.', async ({ page }) => {
    // Configura o refresh para permitir o acesso e pós-atualização
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mustChangePassword: false }),
      });
    });

    await page.route('**/users', async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Password updated successfully', data: null }),
      });
    });

    await page.goto('/auth/update-password');

    await page.locator('[data-testid="password-input"]').fill('nova_senha_segura');
    await page.locator('[data-testid="confirm-password-input"]').fill('nova_senha_segura');
    
    await page.locator('[data-testid="submit-btn"]').click();

    await expect(page).toHaveURL(/\/overview$/);
  });

  test('should show error message when password update fails on backend.', async ({ page }) => {
    await page.route('**/auth/refresh', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, mustChangePassword: true }),
      });
    });

    const backendErrorMessage = 'Erro ao atualizar a senha: a senha atual não pode ser igual à anterior.';

    await page.route('**/users', async (route) => {
      if (route.request().method() !== 'PATCH') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: backendErrorMessage }),
      });
    });

    await page.goto('/auth/update-password');

    await page.locator('[data-testid="password-input"]').fill('senha_antiga_123');
    await page.locator('[data-testid="confirm-password-input"]').fill('senha_antiga_123');
    await page.locator('[data-testid="submit-btn"]').click();

    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toHaveText(backendErrorMessage);
  });
});