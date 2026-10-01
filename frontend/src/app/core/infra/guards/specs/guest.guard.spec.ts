import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { guestGuard } from '../guest.guard';
import { IAuthStorePort } from '../../../domain/ports/auth-store.port';
import { AUTH_STORE_PORT } from '../../tokens/auth.token';

describe('guestGuard', () => {
  let authStoreMock: IAuthStorePort;
  let routerMock: Router;

  beforeEach(() => {
    authStoreMock = {
      isAuthenticated: vi.fn(),
      mustChangePassword: vi.fn(),
      currentUsername: vi.fn(),
      isLoading: vi.fn(),
      error: vi.fn(),
      login: vi.fn(),
      checkSession: vi.fn().mockResolvedValue(undefined),
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

  it('should allow unauthenticated users to access the guest route without refreshing the session.', async () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(false);

    const result = await TestBed.runInInjectionContext(() =>
      guestGuard({} as never, {} as never),
    );

    expect(authStoreMock.checkSession).not.toHaveBeenCalled();
    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect authenticated users without password change to /overview without checking session.', async () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(true);
    vi.mocked(authStoreMock.mustChangePassword).mockReturnValue(false);

    const result = await TestBed.runInInjectionContext(() =>
      guestGuard({} as never, {} as never),
    );

    expect(authStoreMock.checkSession).not.toHaveBeenCalled();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/overview']);
    expect(result).toEqual(['/overview']);
  });

  it('should redirect authenticated users that must change password to /auth/update-password.', async () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(true);
    vi.mocked(authStoreMock.mustChangePassword).mockReturnValue(true);

    const result = await TestBed.runInInjectionContext(() =>
      guestGuard({} as never, {} as never),
    );

    expect(authStoreMock.checkSession).not.toHaveBeenCalled();
    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/update-password']);
    expect(result).toEqual(['/auth/update-password']);
  });

});
