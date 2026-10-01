import { expect, test, type Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${API_BASE_URL}/auth`;

async function fillLoginForm(
  page: Page,
  username = 'usuario_teste',
  password = 'senha_segura_123',
): Promise<void> {
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
}

async function mockSuccessfulLogin(
  page: Page,
  mustChangePassword = false,
): Promise<void> {
  await page.route(LOGIN_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Login successful', mustChangePassword }),
    });
  });
}

test.describe('/auth', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should render the login form with submit disabled initially', async ({ page }) => {
    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByRole('heading', { name: 'SIGADBV' })).toBeVisible();
    await expect(page.getByTestId('username-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('submit-btn')).toBeDisabled();
  });

  test('should enable submit when credentials satisfy form validation', async ({ page }) => {
    await fillLoginForm(page);

    await expect(page.getByTestId('submit-btn')).toBeEnabled();
  });

  test('should display username and password validation errors', async ({ page }) => {
    const usernameInput = page.getByTestId('username-input');
    const passwordInput = page.getByTestId('password-input');

    await usernameInput.fill('ab');
    await usernameInput.blur();
    await expect(page.getByTestId('username-error')).toHaveText(
      'Usuário inválido (mínimo de 3 caracteres)',
    );

    await passwordInput.fill('123456');
    await passwordInput.blur();
    await expect(page.getByTestId('password-error')).toHaveText(
      'Senha inválida (mínimo de 8 caracteres)',
    );
    await expect(page.getByTestId('submit-btn')).toBeDisabled();
  });

  test('should navigate to overview after a successful login', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await fillLoginForm(page, 'usuario_normal');
    await page.getByTestId('submit-btn').click();

    await expect(page).toHaveURL(/\/overview$/);
    await expect(
      page.getByRole('heading', { name: 'Visão Geral do Sistema' }),
    ).toBeVisible();
  });

  test('should navigate to password update when the account requires a password change', async ({ page }) => {
    await mockSuccessfulLogin(page, true);
    await fillLoginForm(page, 'usuario_primeiro_acesso', 'senha_temporaria');
    await page.getByTestId('submit-btn').click();

    await expect(page).toHaveURL(/\/auth\/update-password$/);
    await expect(
      page.getByText('Defina sua nova senha para continuar'),
    ).toBeVisible();
  });

  test('should show the backend message when login is rejected', async ({ page }) => {
    const backendMessage = 'Acesso negado: credenciais inválidas.';

    await page.route(LOGIN_URL, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: backendMessage,
          error: 'Unauthorized',
        }),
      });
    });

    await fillLoginForm(page, 'usuario_errado', 'senha_errada_123');
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('error-message')).toHaveText(backendMessage);
    await expect(page).toHaveURL(/\/auth$/);
  });

  test('should show loading state and prevent duplicate submission', async ({ page }) => {
    let releaseLogin!: () => void;
    const loginGate = new Promise<void>((resolve) => {
      releaseLogin = resolve;
    });

    await page.route(LOGIN_URL, async (route) => {
      await loginGate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Login successful', mustChangePassword: false }),
      });
    });

    await fillLoginForm(page);
    const submitButton = page.getByTestId('submit-btn');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText('Autenticando...');

    releaseLogin();
    await expect(page).toHaveURL(/\/overview$/);
  });

  test('should log out from the profile menu and return to login', async ({ page }) => {
    await mockSuccessfulLogin(page);
    await fillLoginForm(page, 'usuario_normal');
    await page.getByTestId('submit-btn').click();
    await expect(page).toHaveURL(/\/overview$/);

    let logoutRequestReceived = false;
    await page.route(`${API_BASE_URL}/auth/logout`, async (route) => {
      logoutRequestReceived = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logout successful', data: null }),
      });
    });

    await page.getByRole('button', { name: 'Perfil do usuário' }).click();
    await page.getByRole('button', { name: 'Sair' }).click();

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByTestId('username-input')).toBeVisible();
    expect(logoutRequestReceived).toBe(true);
  });

  test('should redirect to login when a protected route has no valid session', async ({ page }) => {
    await page.route(`${API_BASE_URL}/auth/refresh`, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'Session expired',
          error: 'Unauthorized',
        }),
      });
    });

    await page.goto('/overview');

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByTestId('username-input')).toBeVisible();
  });
});