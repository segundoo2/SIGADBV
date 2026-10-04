import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { authGuard } from '../auth.guard';
import { AUTH_STORE_PORT } from '../../tokens/auth.token';
import { IAuthStorePort } from '../../../application/ports/stores/auth-store.port';

describe('authGuard', () => {
  let authStoreMock: IAuthStorePort;
  let routerMock: Router;

  beforeEach(() => {
    authStoreMock = {
      isAuthenticated: vi.fn(),
      mustChangePassword: vi.fn(),
      currentUserEntity: vi.fn().mockReturnValue(null),
      isLoading: vi.fn(),
      error: vi.fn(),
      login: vi.fn(),
      restoreAuthenticationSession: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn(),
    };

    routerMock = {
      createUrlTree: vi.fn(
        (commands: unknown[]) => commands as unknown as UrlTree,
      ),
    } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_STORE_PORT, useValue: authStoreMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow access to the route when the user is already authenticated without checking session.', async () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(true);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(result).toBe(true);
    expect(authStoreMock.restoreAuthenticationSession).not.toHaveBeenCalled();
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should restore the authentication session and allow access when it succeeds.', async () => {
    vi.mocked(authStoreMock.isAuthenticated)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.mocked(authStoreMock.restoreAuthenticationSession).mockResolvedValue(
      undefined,
    );

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(authStoreMock.restoreAuthenticationSession).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /auth/ when the restored session is unauthenticated', async () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(false);
    vi.mocked(authStoreMock.restoreAuthenticationSession).mockResolvedValue(
      undefined,
    );

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, {} as never),
    );

    expect(authStoreMock.restoreAuthenticationSession).toHaveBeenCalledTimes(1);
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/']);
    expect(result).toEqual(['/auth/']);
  });
});
