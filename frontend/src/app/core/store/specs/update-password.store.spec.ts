import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { IUpdatePasswordInput } from '../../application/models/update-password-input.model';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';
import { USERS_API_PORT } from '../../infra/tokens/users.token';
import { UsersStore } from '../users.store';

describe('PasswordUpdateStore', () => {
  let store: UsersStore;
  let apiMock: { updatePassword: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiMock = {
      updatePassword: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [UsersStore, { provide: USERS_API_PORT, useValue: apiMock }],
    });

    store = TestBed.inject(UsersStore);
  });

  it('should initialize with default states', () => {
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.successMessage()).toBe('');
  });

  it('should successfully update password and update state', async () => {
    const payload: IUpdatePasswordInput = {
      password: 'newPassword123',
    };

    apiMock.updatePassword.mockResolvedValueOnce(undefined);

    const promise = store.updatePassword(payload);

    // Verifica se o loading foi ativado durante a requisição
    expect(store.isLoading()).toBe(true);

    await promise;

    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.successMessage()).toBe('Senha atualizada com sucesso.');
    expect(apiMock.updatePassword).toHaveBeenCalledWith(payload);
  });

  it('should handle error state when update fails', async () => {
    const payload: IUpdatePasswordInput = {
      password: 'newPassword123',
    };

    const mockError = new ApiError('Invalid password format', 400);
    apiMock.updatePassword.mockRejectedValueOnce(mockError);

    const promise = store.updatePassword(payload);

    expect(store.isLoading()).toBe(true);

    await promise;

    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Invalid password format');
  });
});
