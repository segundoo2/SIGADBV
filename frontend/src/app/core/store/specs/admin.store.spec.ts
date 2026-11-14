import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_API_PORT } from '../../infra/tokens/admin.token';
import { ROLES_API_PORT } from '../../infra/tokens/roles.token';
import { AdminStore } from '../admin.store';
import { EPermission } from '../../domain/enums/permissions.enum';

describe('AdminStore', () => {
  let store: AdminStore;
  const users = [
    {
      id: 'user-1',
      tenantId: 'tenant-1',
      username: 'edilson.segundo',
      mustChangePassword: false,
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const roles = [
    {
      id: 'role-1',
      tenantId: 'tenant-1',
      name: 'Editor',
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  const adminApi = {
    listUsers: vi.fn(),
    createUser: vi.fn(),
    resetTemporaryPassword: vi.fn(),
  };
  const rolesApi = {
    listRoles: vi.fn(),
    listPermissions: vi.fn(),
    createRole: vi.fn(),
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    adminApi.listUsers.mockResolvedValue(users);
    adminApi.createUser.mockResolvedValue('temporary123');
    adminApi.resetTemporaryPassword.mockResolvedValue('reset12345');
    rolesApi.listRoles.mockResolvedValue(roles);
    rolesApi.listPermissions.mockResolvedValue(Object.values(EPermission));
    rolesApi.createRole.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        AdminStore,
        { provide: ADMIN_API_PORT, useValue: adminApi },
        { provide: ROLES_API_PORT, useValue: rolesApi },
      ],
    });
    store = TestBed.inject(AdminStore);
  });

  it('starts with empty data and idle state', () => {
    expect(store.users()).toEqual([]);
    expect(store.roles()).toEqual([]);
    expect(store.permissions()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.modal()).toBeNull();
  });

  it('loads only data permitted by the supplied access flags', async () => {
    await store.loadData({
      canReadUsers: true,
      canReadRoles: true,
      canCreateRoles: true,
    });
    expect(store.users()).toEqual(users);
    expect(store.roles()).toEqual(roles);
    expect(store.permissions()).toEqual(Object.values(EPermission));
    expect(adminApi.listUsers).toHaveBeenCalledOnce();
    expect(rolesApi.listRoles).toHaveBeenCalledOnce();
    expect(rolesApi.listPermissions).toHaveBeenCalledOnce();
    expect(store.isLoading()).toBe(false);
  });

  it('does not call the APIs when user list access is denied', async () => {
    await store.loadData({
      canReadUsers: false,
      canReadRoles: true,
      canCreateRoles: true,
    });
    expect(adminApi.listUsers).not.toHaveBeenCalled();
    expect(rolesApi.listRoles).not.toHaveBeenCalled();
    expect(rolesApi.listPermissions).not.toHaveBeenCalled();
  });

  it('stores and rethrows initial load errors and stops loading', async () => {
    adminApi.listUsers.mockRejectedValueOnce(
      new Error('Falha ao carregar usuários.'),
    );
    await expect(
      store.loadData({
        canReadUsers: true,
        canReadRoles: false,
        canCreateRoles: false,
      }),
    ).rejects.toThrow('Falha ao carregar usuários.');
    expect(store.error()).toBe('Falha ao carregar usuários.');
    expect(store.isLoading()).toBe(false);
  });

  it('opens create forms and resets form-specific state', () => {
    store.togglePermission(EPermission.USERS_READ, true);
    store.openCreateRole();
    expect(store.modal()).toBe('create-role');
    expect(store.selectedPermissions()).toEqual([]);
    store.openCreateUser();
    expect(store.modal()).toBe('create-user');
  });

  it('adds and removes permissions without duplicates', () => {
    store.togglePermission(EPermission.USERS_READ, true);
    store.togglePermission(EPermission.USERS_READ, true);
    store.togglePermission(EPermission.ROLES_CREATE, true);
    store.togglePermission(EPermission.USERS_READ, false);
    expect(store.selectedPermissions()).toEqual([EPermission.ROLES_CREATE]);
  });

  it('resets a password and exposes the returned password in the modal state', async () => {
    await store.resetTemporaryPassword('edilson.segundo');
    expect(adminApi.resetTemporaryPassword).toHaveBeenCalledWith(
      'edilson.segundo',
    );
    expect(store.temporaryPassword()).toBe('reset12345');
    expect(store.modal()).toBe('temporary-password');
    expect(store.error()).toBeNull();
  });

  it('stores and rethrows password reset errors', async () => {
    adminApi.resetTemporaryPassword.mockRejectedValueOnce(
      new Error('Falha no reset.'),
    );
    await expect(
      store.resetTemporaryPassword('edilson.segundo'),
    ).rejects.toThrow('Falha no reset.');
    expect(store.error()).toBe('Falha no reset.');
    expect(store.modal()).toBe('temporary-password');
  });

  it('creates a user, displays its temporary password, and refreshes users', async () => {
    await store.createUser({ username: 'novo.usuario', roleIds: ['role-1'] });
    expect(adminApi.createUser).toHaveBeenCalledWith({
      username: 'novo.usuario',
      roleIds: ['role-1'],
    });
    expect(store.temporaryPassword()).toBe('temporary123');
    expect(store.modal()).toBe('temporary-password');
    expect(adminApi.listUsers).toHaveBeenCalledOnce();
    expect(store.users()).toEqual(users);
    expect(store.isUserSaving()).toBe(false);
  });

  it('stores and rethrows user creation errors', async () => {
    adminApi.createUser.mockRejectedValueOnce(
      new Error('Usuário já cadastrado.'),
    );
    await expect(
      store.createUser({ username: 'novo.usuario', roleIds: ['role-1'] }),
    ).rejects.toThrow('Usuário já cadastrado.');
    expect(store.error()).toBe('Usuário já cadastrado.');
    expect(store.isUserSaving()).toBe(false);
  });

  it('creates a role, refreshes roles, and closes the form', async () => {
    store.openCreateRole();
    store.togglePermission(EPermission.USERS_READ, true);
    await store.createRole({
      name: 'Leitor',
      permissions: store.selectedPermissions(),
    });
    expect(rolesApi.createRole).toHaveBeenCalledWith({
      name: 'Leitor',
      permissions: [EPermission.USERS_READ],
    });
    expect(rolesApi.listRoles).toHaveBeenCalledOnce();
    expect(store.roles()).toEqual(roles);
    expect(store.modal()).toBeNull();
    expect(store.isRoleSaving()).toBe(false);
  });

  it('stores and rethrows role creation errors', async () => {
    rolesApi.createRole.mockRejectedValueOnce(new Error('Cargo já existe.'));
    store.openCreateRole();
    await expect(
      store.createRole({ name: 'Leitor', permissions: [] }),
    ).rejects.toThrow('Cargo já existe.');
    expect(store.error()).toBe('Cargo já existe.');
    expect(store.modal()).toBe('create-role');
    expect(store.isRoleSaving()).toBe(false);
  });

  it('closes a modal and clears temporary password and errors', async () => {
    await store.resetTemporaryPassword('edilson.segundo');
    store.closeModal();
    expect(store.modal()).toBeNull();
    expect(store.temporaryPassword()).toBeNull();
    expect(store.error()).toBeNull();
  });
});
