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

  test('should enable submit button when credentials are entered.', async ({ page }) => {
    const submitBtn = page.locator('[data-testid="submit-btn"]');

    await expect(submitBtn).toBeDisabled();

    await page.locator('[data-testid="username-input"]').fill('usuario_teste');
    await page.locator('[data-testid="password-input"]').fill('senha_segura_123');

    await expect(submitBtn).toBeEnabled();
  });

  test('should login successfully and access system when password definition is not required.', async ({ page }) => {
    await page.route('**/auth', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          message: 'Success',
          data: { accessToken: 'jwt-token', refreshToken: 'refresh-token' },
          mustChangePassword: false,
        }),
      });
    });

    await page.locator('[data-testid="username-input"]').fill('usuario_normal');
    await page.locator('[data-testid="password-input"]').fill('senha_correta_123');
    await page.locator('[data-testid="submit-btn"]').click();

    await expect(page).toHaveURL('/dashboard'); 
  });

  test('should redirect to password definition page on first login access.', async ({ page }) => {
    await page.route('**/auth', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true,
          message: 'Success',
          data: { accessToken: 'temporary-jwt-token', refreshToken: 'refresh-token' },
          mustChangePassword: true
        }),
      });
    });

    await page.locator('[data-testid="username-input"]').fill('usuario_primeiro_acesso');
    await page.locator('[data-testid="password-input"]').fill('senha_temporaria');
    await page.locator('[data-testid="submit-btn"]').click();

    // Caminho Feliz 2: Página protegida de definir senha
    await expect(page).toHaveURL('/auth/define-password'); 
  });

  test('should show error message on invalid login credentials.', async ({ page }) => {
    const mensagemDinamicaDoBackend = 'Acesso negado: credenciais inválidas.';

    await page.route('**/auth', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: mensagemDinamicaDoBackend }),
      });
    });

    await page.locator('[data-testid="username-input"]').fill('usuario_errado');
    await page.locator('[data-testid="password-input"]').fill('senha_errada');
    await page.locator('[data-testid="submit-btn"]').click();

    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();

    await expect(errorMessage).toHaveText(mensagemDinamicaDoBackend);
  });

  test('should show validation error when username format is invalid.', async ({ page }) => {
    const usernameInput = page.locator('[data-testid="username-input"]');

    await usernameInput.fill('ab');
    await usernameInput.blur();

    const inputError = page.locator('[data-testid="username-error"]');
    await expect(inputError).toBeVisible();
  });

  test('should show validation error when password format is invalid.', async ({ page }) => {
    const passwordInput = page.locator('[data-testid="password-input"]');

    await passwordInput.fill('123456');
    await passwordInput.blur();

    const inputError = page.locator('[data-testid="password-error"]');
    await expect(inputError).toBeVisible();
  });
});