import { expect, test } from '@playwright/test';

const username = process.env.SIMULATION_ADMIN_USERNAME ?? 'sg.code';
const password = process.env.SIMULATION_ADMIN_PASSWORD ?? 'LocalTestPass123';

test('production frontend authenticates against the real backend and loads units', async ({
  page,
}) => {
  const apiResponses: { path: string; status: number }[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/api/')) {
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
      response.url().endsWith('/api/auth') &&
      response.request().method() === 'POST',
  );
  await page.getByTestId('submit-btn').click();
  await loginResponsePromise;

  await expect(page).toHaveURL(/\/overview$/);
  await expect(
    page.getByRole('heading', { name: /Bem-vindo, sg\.code!/ }),
  ).toBeVisible();
  await expect
    .poll(() => apiResponses.some((response) => response.path === '/api/units'))
    .toBe(true);

  const accessCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === 'access_token',
  );
  expect(accessCookie).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
  });
  expect(apiResponses).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: '/api/auth', status: 200 }),
      expect.objectContaining({ path: '/api/units', status: 200 }),
    ]),
  );

  await page.getByRole('heading', { name: 'Unidade de teste local' }).click();
  const historyModal = page.getByRole('dialog');
  await expect(
    historyModal.getByRole('heading', {
      name: 'Histórico - Unidade de teste local',
    }),
  ).toBeVisible();

  const tableBounds = await historyModal.getByRole('table').boundingBox();
  const modalFooterBounds = await historyModal.locator('footer').boundingBox();
  expect(tableBounds).not.toBeNull();
  expect(modalFooterBounds).not.toBeNull();
  expect(modalFooterBounds!.y).toBeGreaterThan(
    tableBounds!.y + tableBounds!.height,
  );
  await expect(
    historyModal.getByRole('button', { name: 'Gerar Relatório (PDF)' }),
  ).toBeVisible();
});
