import { expect, test, type Page } from '@playwright/test';

const API = 'http://localhost:3000';

async function loginAsAdmin(page: Page): Promise<void> {
  await page.route(`${API}/auth`, async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Login successful',
        mustChangePassword: false,
        data: {
          user: {
            id: 'admin',
            tenantId: 'tenant',
            username: 'admin.user',
            mustChangePassword: false,
            roles: [
              {
                id: 'role-admin',
                tenantId: 'tenant',
                name: 'admin',
                permissions: [
                  'users.read',
                  'users.create',
                  'users.update',
                  'roles.read',
                  'roles.create',
                ],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
          },
        },
      }),
    }),
  );
  await page.goto('/auth');
  await page.getByTestId('username-input').fill('admin.user');
  await page.getByTestId('password-input').fill('senha_segura_123');
  await page.getByTestId('submit-btn').click();
  await expect(page).toHaveURL(/\/overview$/);
}

test.describe('Admin users and roles flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.route(`${API}/users?page=1&limit=100`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Users found',
          data: [
            {
              id: 'u1',
              tenantId: 'tenant',
              username: 'edilson.segundo',
              mustChangePassword: false,
              roles: [
                {
                  id: 'r1',
                  tenantId: 'tenant',
                  name: 'Editor',
                  permissions: [],
                  createdAt: '2026-01-01',
                  updatedAt: '2026-01-01',
                },
              ],
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
          meta: {
            itemCount: 1,
            totalItems: 1,
            itemsPerPage: 100,
            totalPages: 1,
            currentPage: 1,
          },
        }),
      }),
    );
    await page.route(`${API}/roles?page=1&limit=100`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Roles found',
          data: [
            {
              id: 'r1',
              tenantId: 'tenant',
              name: 'Editor',
              permissions: [],
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
          ],
          meta: {
            itemCount: 1,
            totalItems: 1,
            itemsPerPage: 100,
            totalPages: 1,
            currentPage: 1,
          },
        }),
      }),
    );
    await page.route(`${API}/permissions`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Permissions loaded',
          data: {
            permissions: ['users.read', 'users.create', 'roles.create'],
            systemAdminRole: 'admin',
          },
        }),
      }),
    );
    await page.getByRole('link', { name: 'Painel Admin' }).click();
  });

  test('resets a user password and closes the result modal', async ({
    page,
  }) => {
    await page.route(
      `${API}/users/edilson.segundo/temporary-password`,
      (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Temporary password generated',
            data: { temporaryPassword: 'reset12345' },
          }),
        }),
    );
    await page
      .getByRole('button', { name: 'Resetar senha de edilson.segundo' })
      .click();
    await expect(page.getByText('reset12345')).toBeVisible();
    await page.getByRole('button', { name: 'Fechar modal' }).last().click();
    await expect(page.getByText('reset12345')).toBeHidden();
  });

  test('creates a user with selected role and displays its initial password', async ({
    page,
  }) => {
    await page.route(`${API}/users`, async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        username: 'novo.usuario',
        roleIds: ['r1'],
      });
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Created',
          data: { temporaryPassword: 'initial123' },
        }),
      });
    });
    await page.getByRole('button', { name: 'Adicionar usuário' }).click();
    await page.getByTestId('new-username').fill('novo.usuario');
    await page.getByTestId('new-user-role').selectOption('r1');
    await page.getByRole('button', { name: 'Cadastrar usuário' }).click();
    await expect(page.getByText('initial123')).toBeVisible();
  });

  test('creates a role with selected permissions', async ({ page }) => {
    let roleCreated = false;
    await page.unroute(`${API}/roles?page=1&limit=100`);
    await page.route(`${API}/roles?page=1&limit=100`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Roles found',
          data: [
            {
              id: 'r1',
              tenantId: 'tenant',
              name: 'Editor',
              permissions: [],
              createdAt: '2026-01-01',
              updatedAt: '2026-01-01',
            },
            ...(roleCreated
              ? [
                  {
                    id: 'r2',
                    tenantId: 'tenant',
                    name: 'Leitor',
                    permissions: ['users.read'],
                    createdAt: '2026-01-01',
                    updatedAt: '2026-01-01',
                  },
                ]
              : []),
          ],
          meta: {
            itemCount: roleCreated ? 2 : 1,
            totalItems: roleCreated ? 2 : 1,
            itemsPerPage: 100,
            totalPages: 1,
            currentPage: 1,
          },
        }),
      }),
    );
    await page.route(`${API}/roles`, async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        name: 'Leitor',
        permissions: ['users.read'],
      });
      roleCreated = true;
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Role created', data: { id: 'r2' } }),
      });
    });
    await page.getByRole('button', { name: 'Adicionar Cargo' }).click();
    await page.getByTestId('new-role-name').fill('Leitor');
    await page.getByLabel('users.read').check();
    await page.getByRole('button', { name: 'Cadastrar cargo' }).click();
    await expect(page.getByTestId('new-role-name')).toBeHidden();
    await page.getByRole('button', { name: 'Adicionar usuário' }).click();
    await expect(
      page.getByTestId('new-user-role').locator('option[value="r2"]'),
    ).toHaveText('Leitor');
  });
});
