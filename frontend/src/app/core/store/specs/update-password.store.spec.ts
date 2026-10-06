import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { PasswordUpdateStore } from '../update-password.store';
import { UPDATE_PASSWORD_API_PORT } from '../../infra/tokens/update-password.token';
import { IUpdatePasswordInput } from '../../application/models/update-password-input.model';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';

describe('PasswordUpdateStore', () => {
  let store: PasswordUpdateStore;
  let apiMock: { updatePassword: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiMock = {
      updatePassword: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PasswordUpdateStore,
        { provide: UPDATE_PASSWORD_API_PORT, useValue: apiMock },
      ],
    });

    store = TestBed.inject(PasswordUpdateStore);
  });

  it('should initialize with default states', () => {
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.successMessage()).toBe('');
  });

  it('should successfully update password and update state', async () => {
    const payload: IUpdatePasswordInput = {
      username: 'john.doe',
      password: 'newPassword123',
      mustChangePassword: false,
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
      username: 'john.doe',
      password: 'newPassword123',
      mustChangePassword: false,
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
