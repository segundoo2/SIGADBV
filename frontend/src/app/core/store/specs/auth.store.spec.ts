import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AuthStore } from '../auth.store';
import { IAuthApiPort } from '../../domain/ports/auth-api.port';
import { AUTH_API_PORT } from '../../infra/tokens/auth.token';

describe('AuthStore', () => {
  let store: AuthStore;
  let authApiMock: IAuthApiPort;

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
  });

  it('should authenticate successfully and flag mustChangePassword as true when required', async () => {
    const mockResponse = {
      success: true,
      message: 'Success',
      data: { accessToken: 'token-123', refreshToken: 'ref-123' },
      mustChangePassword: true,
    };

    vi.mocked(authApiMock.login).mockResolvedValue(mockResponse);

    const credentials = { username: 'john', password: '123' };
    const success = await store.login(credentials);

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(true);
    expect(authApiMock.login).toHaveBeenCalledWith(credentials);
  });

  it('should authenticate successfully and keep mustChangePassword as false for regular users', async () => {
    const mockResponse = {
      success: true,
      message: 'Success',
      data: { accessToken: 'token-123', refreshToken: 'ref-123' },
      mustChangePassword: false,
    };

    vi.mocked(authApiMock.login).mockResolvedValue(mockResponse);

    const credentials = { username: 'john', password: '123' };
    const success = await store.login(credentials);

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.mustChangePassword()).toBe(false);
  });

  it('should handle login error correctly and reset flags', async () => {
    vi.mocked(authApiMock.login).mockRejectedValue(new Error('Invalid credentials'));

    const credentials = { username: 'john', password: 'wrong' };
    const success = await store.login(credentials);

    expect(success).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Invalid credentials');
    expect(store.mustChangePassword()).toBe(false);
  });

  it('should reset state on logout', async () => {
    vi.mocked(authApiMock.logout).mockResolvedValue({ message: 'Logged out' });

    await store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(false);
    expect(authApiMock.logout).toHaveBeenCalled();
  });
});