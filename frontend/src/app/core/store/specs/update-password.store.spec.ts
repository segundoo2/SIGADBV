import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { UpdatePasswordStore } from '../update-password.store';
import { UPDATE_PASSWORD_API_PORT } from '../../infra/tokens/update-password.token';
import { IUpdatePasswordDto } from '../../domain/models/update-password-dto.model';
import { IResponseModel } from '../../domain/models/response.model';
import { ApiError } from '../../infra/interceptors/api-error.interceptor';

describe('UpdatePasswordStore', () => {
  let store: UpdatePasswordStore;
  let apiMock: { updatePassword: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiMock = {
      updatePassword: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdatePasswordStore,
        { provide: UPDATE_PASSWORD_API_PORT, useValue: apiMock },
      ],
    });

    store = TestBed.inject(UpdatePasswordStore);
  });

  it('should initialize with default states', () => {
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.successMessage()).toBe('');
  });

  it('should successfully update password and update state', async () => {
    const payload: IUpdatePasswordDto = {
      username: 'john.doe',
      password: 'newPassword123',
      mustChangePassword: false,
    };

    const mockResponse: IResponseModel<null> = {
      message: 'Password updated successfully',
      data: null,
    };

    apiMock.updatePassword.mockResolvedValueOnce(mockResponse);

    const promise = store.updatePassword(payload);

    // Verifica se o loading foi ativado durante a requisição
    expect(store.isLoading()).toBe(true);

    const result = await promise;

    expect(result).toEqual(mockResponse);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.successMessage()).toBe('Password updated successfully');
    expect(apiMock.updatePassword).toHaveBeenCalledWith(payload);
  });

  it('should handle error state when update fails', async () => {
    const payload: IUpdatePasswordDto = {
      username: 'john.doe',
      password: 'newPassword123',
      mustChangePassword: false,
    };

    const mockError = new ApiError('Invalid password format', 400);
    apiMock.updatePassword.mockRejectedValueOnce(mockError);

    const promise = store.updatePassword(payload);

    expect(store.isLoading()).toBe(true);

    const result = await promise;

    expect(result.message).toBe('Invalid password format');
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Invalid password format');
  });
});
