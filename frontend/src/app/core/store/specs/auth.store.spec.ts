import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AuthStore } from '../auth.store';
import { AUTH_API_PORT } from '../../infra/tokens/auth.token';
import { IAuthResponseModel } from '../../domain/models/auth-response.model';
import { EErrorsGlobal } from '../../domain/enums/errors-global.enum';
import { IAuthApiPort } from '../../domain/ports/apis/auth-api.port';

describe('AuthStore', () => {
  let store: AuthStore;
  let authApiMock: IAuthApiPort;

  const credentials = { username: 'john', password: '123' };

  beforeEach(() => {
    authApiMock = {
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthStore,
        { provide: AUTH_API_PORT, useValue: authApiMock },
      ],
    });

    store = TestBed.inject(AuthStore);
  });

  it('should initialize with default unauthenticated state and no password change requirement', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUsername()).toBe('');
  });

  it('should authenticate successfully, store username and flag mustChangePassword as true when required', async () => {
    const mockResponse: IAuthResponseModel = {
      message: 'Success',
      mustChangePassword: true,
    };

    vi.mocked(authApiMock.login).mockResolvedValue(mockResponse);

    const success = await store.login(credentials);

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(true);
    expect(store.currentUsername()).toBe(credentials.username);
    expect(authApiMock.login).toHaveBeenCalledWith(credentials);
  });

  it('should authenticate successfully and keep mustChangePassword as false for regular users', async () => {
    const mockResponse: IAuthResponseModel = {
      message: 'Success',
      mustChangePassword: false,
    };

    vi.mocked(authApiMock.login).mockResolvedValue(mockResponse);

    const success = await store.login(credentials);

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUsername()).toBe(credentials.username);
  });

  it('should handle login error correctly and reset flags without storing username', async () => {
    vi.mocked(authApiMock.login).mockRejectedValue(new Error('Invalid credentials'));

    const success = await store.login({ username: 'john', password: 'wrong' });

    expect(success).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Invalid credentials');
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUsername()).toBe('');
  });

  it('should use global server error message when login fails with a non-Error value', async () => {
    vi.mocked(authApiMock.login).mockRejectedValue('unexpected');

    const success = await store.login(credentials);

    expect(success).toBe(false);
    expect(store.error()).toBe(EErrorsGlobal.SERVER_ERROR);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('should restore session from refresh and apply mustChangePassword', async () => {
    const mockResponse: IAuthResponseModel = {
      message: 'Session restored',
      mustChangePassword: true,
    };

    vi.mocked(authApiMock.refresh).mockResolvedValue(mockResponse);

    await store.checkSession();

    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.mustChangePassword()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('should restore session as authenticated without requiring password change', async () => {
    vi.mocked(authApiMock.refresh).mockResolvedValue({
      message: 'Session restored',
      mustChangePassword: false,
    });

    await store.checkSession();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.mustChangePassword()).toBe(false);
  });

  it('should mark session as unauthenticated when refresh fails', async () => {
    vi.mocked(authApiMock.refresh).mockRejectedValue(new Error('Falha ao recuperar a sessão.'));

    await store.checkSession();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.mustChangePassword()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.currentUsername()).toBe('');
  });

  it('should keep isLoading true while checkSession is in progress', async () => {
    let resolveRefresh!: (value: IAuthResponseModel) => void;
    vi.mocked(authApiMock.refresh).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const pending = store.checkSession();

    expect(store.isLoading()).toBe(true);

    resolveRefresh({ message: 'ok', mustChangePassword: false });
    await pending;

    expect(store.isLoading()).toBe(false);
  });

  it('should reset state including currentUsername on logout', async () => {
    vi.mocked(authApiMock.login).mockResolvedValue({
      message: 'Success',
      mustChangePassword: true,
    });
    vi.mocked(authApiMock.logout).mockResolvedValue({ message: 'Logged out' });

    await store.login(credentials);
    await store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUsername()).toBe('');
    expect(authApiMock.logout).toHaveBeenCalled();
  });

  it('should still clear local session when logout request fails', async () => {
    vi.mocked(authApiMock.login).mockResolvedValue({
      message: 'Success',
      mustChangePassword: false,
    });
    vi.mocked(authApiMock.logout).mockRejectedValue(new Error('Network error'));

    await store.login(credentials);
    await expect(store.logout()).rejects.toThrow('Network error');

    expect(store.isAuthenticated()).toBe(false);
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUsername()).toBe('');
    expect(store.error()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });
});
