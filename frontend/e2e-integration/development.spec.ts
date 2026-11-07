import { expect, test } from '@playwright/test';

const username = process.env.SIMULATION_ADMIN_USERNAME ?? 'sg.code';
const password = process.env.SIMULATION_ADMIN_PASSWORD ?? 'LocalTestPass123';

test('development frontend authenticates against the real backend and loads units', async ({
  page,
}) => {
  const apiResponses: { path: string; status: number }[] = [];
  page.on('response', (response) => {
    if (new URL(response.url()).origin === 'http://localhost:3000') {
      apiResponses.push({
        path: new URL(response.url()).pathname,
        status: response.status(),
      });
    }
  });

  await page.goto('/auth');
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);
  const loginResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/auth') &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('submit-btn').click();
  await loginResponsePromise;

  await expect(page).toHaveURL(/\/overview$/);
  await expect(
    page.getByRole('heading', { name: /Bem-vindo, sg\.code!/ }),
  ).toBeVisible();
  await expect
    .poll(() => apiResponses.some((response) => response.path === '/units'))
    .toBe(true);

  const accessCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'access_token',
  );
  expect(accessCookie).toMatchObject({
    httpOnly: true,
    secure: false,
    sameSite: 'Strict',
  });
  expect(apiResponses).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: '/auth', status: 200 }),
      expect.objectContaining({ path: '/units', status: 200 }),
    ]),
  );
});
