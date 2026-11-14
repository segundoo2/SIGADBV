import { Injectable, inject, signal } from '@angular/core';
import {
  IAdminStorePort,
  AdminDataAccess,
  AdminModal,
} from '../application/ports/stores/admin-store.port';
import { ADMIN_API_PORT } from '../infra/tokens/admin.token';
import { ROLES_API_PORT } from '../infra/tokens/roles.token';
import { UserEntity } from '../domain/entities/user.entity';
import { RoleEntity } from '../domain/entities/role.entity';
import {
  CreateRoleRequest,
  CreateUserRequest,
} from '../application/models/admin-management.models';
import { getErrorMessage } from '../application/errors/get-error-message';
import { ALL_PERMISSIONS } from '../domain/enums/permissions.enum';

@Injectable({ providedIn: 'root' })
export class AdminStore implements IAdminStorePort {
  private readonly adminApi = inject(ADMIN_API_PORT);
  private readonly rolesApi = inject(ROLES_API_PORT);

  private readonly _users = signal<UserEntity[]>([]);
  private readonly _roles = signal<RoleEntity[]>([]);
  private readonly _permissions = signal<string[]>(ALL_PERMISSIONS);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _modal = signal<AdminModal>(null);
  private readonly _temporaryPassword = signal<string | null>(null);
  private readonly _selectedPermissions = signal<string[]>([]);
  private readonly _isUserSaving = signal(false);
  private readonly _isRoleSaving = signal(false);

  readonly users = this._users.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly modal = this._modal.asReadonly();
  readonly temporaryPassword = this._temporaryPassword.asReadonly();
  readonly selectedPermissions = this._selectedPermissions.asReadonly();
  readonly isUserSaving = this._isUserSaving.asReadonly();
  readonly isRoleSaving = this._isRoleSaving.asReadonly();

  async loadData(access: AdminDataAccess): Promise<void> {
    if (!access.canReadUsers) return;

    this._isLoading.set(true);
    this._error.set(null);
    const requests: Promise<void>[] = [
      this.adminApi.listUsers().then((users) => this._users.set(users)),
    ];
    if (access.canReadRoles) {
      requests.push(
        this.rolesApi.listRoles().then((roles) => this._roles.set(roles)),
      );
    }
    if (access.canCreateRoles) {
      requests.push(
        this.rolesApi
          .listPermissions()
          .then((permissions) => this._permissions.set(permissions)),
      );
    }

    try {
      await Promise.all(requests);
    } catch (error: unknown) {
      this._error.set(getErrorMessage(error));
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  openCreateUser(): void {
    this._error.set(null);
    this._modal.set('create-user');
  }

  openCreateRole(): void {
    this._error.set(null);
    this._selectedPermissions.set([]);
    this._modal.set('create-role');
  }

  closeModal(): void {
    this._modal.set(null);
    this._temporaryPassword.set(null);
    this._error.set(null);
  }

  togglePermission(permission: string, checked: boolean): void {
    this._selectedPermissions.update((selected) =>
      checked
        ? selected.includes(permission)
          ? selected
          : [...selected, permission]
        : selected.filter((item) => item !== permission),
    );
  }

  async resetTemporaryPassword(username: string): Promise<void> {
    this._error.set(null);
    this._temporaryPassword.set(null);
    this._modal.set('temporary-password');
    try {
      this._temporaryPassword.set(
        await this.adminApi.resetTemporaryPassword(username),
      );
    } catch (error: unknown) {
      this._error.set(getErrorMessage(error));
      throw error;
    }
  }

  async createUser(request: CreateUserRequest): Promise<void> {
    this._isUserSaving.set(true);
    this._error.set(null);
    try {
      this._temporaryPassword.set(await this.adminApi.createUser(request));
      this._modal.set('temporary-password');
      this._users.set(await this.adminApi.listUsers());
    } catch (error: unknown) {
      this._error.set(getErrorMessage(error));
      throw error;
    } finally {
      this._isUserSaving.set(false);
    }
  }

  async createRole(request: CreateRoleRequest): Promise<void> {
    this._isRoleSaving.set(true);
    this._error.set(null);
    try {
      await this.rolesApi.createRole(request);
      this._roles.set(await this.rolesApi.listRoles());
      this.closeModal();
    } catch (error: unknown) {
      this._error.set(getErrorMessage(error));
      throw error;
    } finally {
      this._isRoleSaving.set(false);
    }
  }
}
