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

  it('should initialize with default unauthenticated state', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should authenticate user successfully on valid credentials', async () => {
    vi.mocked(authApiMock.login).mockResolvedValue({ message: 'Success' });

    const credentials = { username: 'john', password: '123' };
    const success = await store.login(credentials);

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(authApiMock.login).toHaveBeenCalledWith(credentials);
  });

  it('should handle login error correctly', async () => {
    vi.mocked(authApiMock.login).mockRejectedValue(new Error('Invalid credentials'));

    const credentials = { username: 'john', password: 'wrong' };
    const success = await store.login(credentials);

    expect(success).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Invalid credentials');
  });

  it('should reset state on logout', async () => {
    vi.mocked(authApiMock.logout).mockResolvedValue({ message: 'Logged out' });

    await store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(authApiMock.logout).toHaveBeenCalled();
  });
});