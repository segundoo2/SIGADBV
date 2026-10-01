import { expect, test, type Page } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3000';
const LOGIN_URL = `${API_BASE_URL}/auth`;
const UPDATE_PASSWORD_URL = `${API_BASE_URL}/users`;
const FIRST_ACCESS_USERNAME = 'usuario_primeiro_acesso';
const TEMPORARY_PASSWORD = 'senha_temporaria_123';

async function loginForPasswordChange(page: Page): Promise<void> {
  await page.route(LOGIN_URL, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Login successful',
        mustChangePassword: true,
      }),
    });
  });

  await page.goto('/auth');
  await page.getByTestId('username-input').fill(FIRST_ACCESS_USERNAME);
  await page.getByTestId('password-input').fill(TEMPORARY_PASSWORD);
  await page.getByTestId('submit-btn').click();
  await expect(page).toHaveURL(/\/auth\/update-password$/);
}

async function fillMatchingPasswords(
  page: Page,
  password = 'nova_senha_segura_123',
): Promise<void> {
  await page.getByTestId('password-input').fill(password);
  await page.getByTestId('confirm-password-input').fill(password);
}

test('should redirect to login when the protected password page has no valid session', async ({
  page,
}) => {
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

  await page.goto('/auth/update-password');

  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByTestId('username-input')).toBeVisible();
});

test.describe('/auth/update-password', () => {
  test.beforeEach(async ({ page }) => {
    await loginForPasswordChange(page);
  });

  test('should render the password update form with submit disabled initially', async ({
    page,
  }) => {
    await expect(
      page.getByText('Defina sua nova senha para continuar'),
    ).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('submit-btn')).toBeDisabled();
  });

  test('should enable submit when matching passwords are valid', async ({
    page,
  }) => {
    await fillMatchingPasswords(page);

    await expect(page.getByTestId('submit-btn')).toBeEnabled();
  });

  test('should show a validation error for passwords shorter than eight characters', async ({
    page,
  }) => {
    const passwordInput = page.getByTestId('password-input');
    await passwordInput.fill('123456');
    await passwordInput.blur();

    await expect(page.getByTestId('password-error')).toHaveText(
      'Senha inválida (mínimo de 8 caracteres)',
    );
    await expect(page.getByTestId('submit-btn')).toBeDisabled();
  });

  test('should show a validation error when confirmation does not match', async ({
    page,
  }) => {
    await page.getByTestId('password-input').fill('nova_senha_segura_123');
    const confirmationInput = page.getByTestId('confirm-password-input');
    await confirmationInput.fill('senha_diferente_123');
    await confirmationInput.blur();

    await expect(page.getByTestId('confirm-password-error')).toHaveText(
      'As senhas não coincidem',
    );
    await expect(page.getByTestId('submit-btn')).toBeDisabled();
  });

  test('should submit the authenticated username and redirect to overview on success', async ({
    page,
  }) => {
    await page.route(UPDATE_PASSWORD_URL, async (route) => {
      expect(route.request().method()).toBe('PATCH');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password updated successfully',
          data: null,
        }),
      });
    });

    await fillMatchingPasswords(page);
    const updateRequest = page.waitForRequest(
      (request) =>
        request.url() === UPDATE_PASSWORD_URL && request.method() === 'PATCH',
    );
    await page.getByTestId('submit-btn').click();

    const request = await updateRequest;
    expect(request.postDataJSON()).toEqual({
      username: FIRST_ACCESS_USERNAME,
      password: 'nova_senha_segura_123',
      mustChangePassword: false,
    });
    await expect(page).toHaveURL(/\/overview$/);
  });

  test('should show a NestJS error message and stay on the password page', async ({
    page,
  }) => {
    const backendMessage = 'A senha atual não pode ser igual à anterior.';

    await page.route(UPDATE_PASSWORD_URL, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 400,
          message: backendMessage,
          error: 'Bad Request',
        }),
      });
    });

    await fillMatchingPasswords(page);
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('error-message')).toHaveText(backendMessage);
    await expect(page).toHaveURL(/\/auth\/update-password$/);
  });

  test('should display joined validation messages returned by NestJS', async ({
    page,
  }) => {
    await page.route(UPDATE_PASSWORD_URL, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 400,
          message: ['Password is too weak', 'Password was recently used'],
          error: 'Bad Request',
        }),
      });
    });

    await fillMatchingPasswords(page);
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('error-message')).toHaveText(
      'Password is too weak, Password was recently used',
    );
    await expect(page).toHaveURL(/\/auth\/update-password$/);
  });

  test('should show loading state and disable the form while updating', async ({
    page,
  }) => {
    let releaseUpdate!: () => void;
    const updateGate = new Promise<void>((resolve) => {
      releaseUpdate = resolve;
    });

    await page.route(UPDATE_PASSWORD_URL, async (route) => {
      await updateGate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Password updated successfully',
          data: null,
        }),
      });
    });

    await fillMatchingPasswords(page);
    const submitButton = page.getByTestId('submit-btn');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton).toContainText('Atualizando...');
    await expect(page.getByTestId('password-input')).toBeDisabled();

    releaseUpdate();
    await expect(page).toHaveURL(/\/overview$/);
  });
});
