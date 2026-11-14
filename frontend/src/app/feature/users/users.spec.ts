import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersPage } from './users';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { ADMIN_STORE_PORT } from '../../core/infra/tokens/admin.token';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { provideRouter } from '@angular/router';

describe('UsersPage', () => {
  let fixture: ComponentFixture<UsersPage>;
  const userCurrentEntity = signal({
    id: 'admin-1',
    tenantId: 'tenant-1',
    username: 'admin.user',
    mustChangePassword: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [
      {
        id: 'role-admin',
        tenantId: 'tenant-1',
        name: 'admin',
        permissions: [
          EPermission.USERS_READ,
          EPermission.USERS_CREATE,
          EPermission.USERS_UPDATE,
          EPermission.ROLES_READ,
          EPermission.ROLES_CREATE,
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  });
  const users = signal([
    {
      id: 'user-1',
      tenantId: 'tenant-1',
      username: 'edilson.segundo',
      mustChangePassword: false,
      roles: [
        {
          id: 'role-1',
          tenantId: 'tenant-1',
          name: 'Editor',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  const roles = signal([
    {
      id: 'role-1',
      tenantId: 'tenant-1',
      name: 'Editor',
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  const error = signal<string | null>(null);
  const modal = signal<
    'create-user' | 'create-role' | 'temporary-password' | null
  >(null);
  const temporaryPassword = signal<string | null>(null);

  const adminStoreMock = {
    users,
    roles,
    error,
    modal,
    temporaryPassword,
    isLoading: signal(false),
    isUserSaving: signal(false),
    loadData: vi.fn().mockResolvedValue(undefined),
    openCreateUser: vi.fn(() => modal.set('create-user')),
    closeModal: vi.fn(() => modal.set(null)),
    resetTemporaryPassword: vi.fn().mockResolvedValue(undefined),
    createUser: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    userCurrentEntity.set({
      ...userCurrentEntity(),
      roles: [
        {
          ...userCurrentEntity().roles[0],
          permissions: [
            EPermission.USERS_READ,
            EPermission.USERS_CREATE,
            EPermission.USERS_UPDATE,
            EPermission.ROLES_READ,
            EPermission.ROLES_CREATE,
          ],
        },
      ],
    });
    users.set([{ ...users()[0] }]);
    roles.set([{ ...roles()[0] }]);
    modal.set(null);
    temporaryPassword.set(null);
    error.set(null);

    await TestBed.configureTestingModule({
      imports: [UsersPage],
      providers: [
        provideRouter([]),
        {
          provide: AUTH_STORE_PORT,
          useValue: { logout: vi.fn().mockResolvedValue(undefined) },
        },
        { provide: USERS_STORE_PORT, useValue: { userCurrentEntity } },
        { provide: ADMIN_STORE_PORT, useValue: adminStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('requests the store data according to the current user permissions', () => {
    expect(adminStoreMock.loadData).toHaveBeenCalledWith({
      canReadUsers: true,
      canReadRoles: true,
      canCreateRoles: false,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'edilson.segundo',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Editor',
    );
  });

  it('forwards the selected user to password reset and closes through the store', async () => {
    await fixture.componentInstance.openResetPassword('edilson.segundo');
    expect(adminStoreMock.resetTemporaryPassword).toHaveBeenCalledWith(
      'edilson.segundo',
    );
    fixture.componentInstance.closeModal();
    expect(adminStoreMock.closeModal).toHaveBeenCalledOnce();
  });

  it('submits valid user form values through the store', async () => {
    fixture.componentInstance.openCreateUser();
    fixture.componentInstance.createUsername.setValue('novo.usuario');
    fixture.componentInstance.createRoleId.setValue('role-1');
    await fixture.componentInstance.submitUser();
    expect(adminStoreMock.createUser).toHaveBeenCalledWith({
      username: 'novo.usuario',
      roleIds: ['role-1'],
    });
  });

  it('does not submit invalid user forms', async () => {
    fixture.componentInstance.createUsername.setValue('inválido');
    fixture.componentInstance.createRoleId.setValue('');
    await fixture.componentInstance.submitUser();
    expect(adminStoreMock.createUser).not.toHaveBeenCalled();
  });

  it('passes denied read access to the store and renders the access denied message', () => {
    userCurrentEntity.set({ ...userCurrentEntity(), roles: [] });
    fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
    expect(adminStoreMock.loadData).toHaveBeenLastCalledWith({
      canReadUsers: false,
      canReadRoles: false,
      canCreateRoles: false,
    });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Acesso restrito',
    );
  });
});
