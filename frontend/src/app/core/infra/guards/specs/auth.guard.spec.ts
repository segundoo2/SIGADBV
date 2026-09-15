import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { authGuard } from '../auth.guard';
import { IAuthStorePort } from '../../../domain/ports/auth-store.port';
import { AUTH_STORE_PORT } from '../../tokens/auth.token';

describe('authGuard', () => {
  let authStoreMock: IAuthStorePort;
  let routerMock: Router;

  beforeEach(() => {
    authStoreMock = {
      isAuthenticated: vi.fn(),
      isLoading: vi.fn(),
      error: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
    };

    routerMock = {
      createUrlTree: vi.fn((commands: unknown[]) => commands as unknown as UrlTree),
    } as unknown as Router;

    TestBed.configureTestingModule({
      providers: [
        { provide: AUTH_STORE_PORT, useValue: authStoreMock },
        { provide: Router, useValue: routerMock },
      ],
    });
  });

  it('should allow access to the route when the user is authenticated.', () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /auth/login when the user is not authenticated', () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/']);
    expect(result).toEqual(['/auth/']);
  });
});