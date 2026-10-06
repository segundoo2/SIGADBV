import { TestBed } from '@angular/core/testing';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { AuthenticationStore } from '../auth.store';
import { AUTH_API_PORT } from '../../infra/tokens/auth.token';
import { IAuthSession } from '../../application/models/auth-session.model';
import { EErrorsGlobal } from '../../application/enums/errors-global.enum';
import { IAuthApiPort } from '../../application/ports/apis/auth-api.port';
import { signal } from '@angular/core';
import { USERS_STORE_PORT } from '../../infra/tokens/users.token';
import { UserEntity } from '../../domain/entities/user.entity';

describe('AuthStore', () => {
  let store: AuthenticationStore;
  let authApiMock: IAuthApiPort;
  let currentUser: ReturnType<typeof signal<UserEntity | null>>;

  const credentials = { username: 'john', password: '123' };
  const mockUser = {
    id: 'user-id',
    tenantId: 'tenant-id',
    username: 'john',
    mustChangePassword: false,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    authApiMock = {
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
    };
    currentUser = signal<UserEntity | null>(null);

    TestBed.configureTestingModule({
      providers: [
        AuthenticationStore,
        { provide: AUTH_API_PORT, useValue: authApiMock },
        {
          provide: USERS_STORE_PORT,
          useValue: {
            userCurrentEntity: currentUser,
            error: signal(null),
            setCurrentUser: vi.fn((user: UserEntity) => currentUser.set(user)),
            clearCurrentUser: vi.fn(() => currentUser.set(null)),
          },
        },
      ],
    });

    store = TestBed.inject(AuthenticationStore);
  });

  it('should initialize with default unauthenticated state and no password change requirement', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUserEntity()).toBeNull();
  });

  it('should authenticate and store the user when password change is required', async () => {
    const mockResponse: IAuthSession = {
      user: mockUser,
      mustChangePassword: true,
    };

    vi.mocked(authApiMock.login).mockResolvedValue(mockResponse);

    const success = await store.login(credentials);

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(true);
    expect(store.currentUserEntity()).toEqual(mockUser);
    expect(authApiMock.login).toHaveBeenCalledWith(credentials);
  });

  it('should authenticate successfully and keep mustChangePassword as false for regular users', async () => {
    const mockResponse: IAuthSession = {
      user: mockUser,
      mustChangePassword: false,
    };

    vi.mocked(authApiMock.login).mockResolvedValue(mockResponse);

    const success = await store.login(credentials);

    expect(success).toBe(true);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUserEntity()).toEqual(mockUser);
  });

  it('should handle login error correctly and reset flags without storing username', async () => {
    vi.mocked(authApiMock.login).mockRejectedValue(
      new Error('Invalid credentials'),
    );

    const success = await store.login({ username: 'john', password: 'wrong' });

    expect(success).toBe(false);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBe('Invalid credentials');
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUserEntity()).toBeNull();
  });

  it('should use global server error message when login fails with a non-Error value', async () => {
    vi.mocked(authApiMock.login).mockRejectedValue('unexpected');

    const success = await store.login(credentials);

    expect(success).toBe(false);
    expect(store.error()).toBe(EErrorsGlobal.SERVER_ERROR);
    expect(store.isAuthenticated()).toBe(false);
  });

  it('should restore session from refresh and apply mustChangePassword', async () => {
    const mockResponse: IAuthSession = {
      user: mockUser,
      mustChangePassword: true,
    };

    vi.mocked(authApiMock.refresh).mockResolvedValue(mockResponse);

    await store.restoreAuthenticationSession();

    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.mustChangePassword()).toBe(true);
    expect(store.currentUserEntity()).toEqual(mockUser);
    expect(store.isLoading()).toBe(false);
  });

  it('should restore session as authenticated without requiring password change', async () => {
    vi.mocked(authApiMock.refresh).mockResolvedValue({
      user: mockUser,
      mustChangePassword: false,
    });

    await store.restoreAuthenticationSession();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.mustChangePassword()).toBe(false);
  });

  it('should mark session as unauthenticated when refresh fails', async () => {
    vi.mocked(authApiMock.refresh).mockRejectedValue(
      new Error('Falha ao recuperar a sessão.'),
    );

    await store.restoreAuthenticationSession();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.mustChangePassword()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.currentUserEntity()).toBeNull();
  });

  it('should keep isLoading true while restoring the authentication session', async () => {
    let resolveRefresh!: (value: IAuthSession) => void;
    vi.mocked(authApiMock.refresh).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const pending = store.restoreAuthenticationSession();

    expect(store.isLoading()).toBe(true);

    resolveRefresh({
      user: mockUser,
      mustChangePassword: false,
    });
    await pending;

    expect(store.isLoading()).toBe(false);
  });

  it('should share an in-flight session check between concurrent callers', async () => {
    let resolveRefresh!: (value: IAuthSession) => void;
    vi.mocked(authApiMock.refresh).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        }),
    );

    const firstCheck = store.restoreAuthenticationSession();
    const secondCheck = store.restoreAuthenticationSession();

    expect(authApiMock.refresh).toHaveBeenCalledTimes(1);
    expect(secondCheck).toBe(firstCheck);

    resolveRefresh({
      user: mockUser,
      mustChangePassword: false,
    });
    await Promise.all([firstCheck, secondCheck]);

    expect(store.isAuthenticated()).toBe(true);
    expect(store.isLoading()).toBe(false);
  });

  it('should reset state including currentUserEntity on logout', async () => {
    vi.mocked(authApiMock.login).mockResolvedValue({
      user: mockUser,
      mustChangePassword: true,
    });
    vi.mocked(authApiMock.logout).mockResolvedValue(undefined);

    await store.login(credentials);
    await store.logout();

    expect(store.isAuthenticated()).toBe(false);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUserEntity()).toBeNull();
    expect(authApiMock.logout).toHaveBeenCalled();
  });

  it('should still clear local session when logout request fails', async () => {
    vi.mocked(authApiMock.login).mockResolvedValue({
      user: mockUser,
      mustChangePassword: false,
    });
    vi.mocked(authApiMock.logout).mockRejectedValue(new Error('Network error'));

    await store.login(credentials);
    await expect(store.logout()).rejects.toThrow('Network error');

    expect(store.isAuthenticated()).toBe(false);
    expect(store.mustChangePassword()).toBe(false);
    expect(store.currentUserEntity()).toBeNull();
    expect(store.error()).toBeNull();
    expect(store.isLoading()).toBe(false);
  });
});
