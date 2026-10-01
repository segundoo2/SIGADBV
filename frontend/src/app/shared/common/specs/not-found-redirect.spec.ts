import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { NotFoundRedirect } from '../not-found-redirect';
import { AUTH_STORE_PORT } from '../../../core/infra/tokens/auth.token';
import { IAuthStorePort } from '../../../core/domain/ports/auth-store.port';

describe('NotFoundRedirect', () => {
  let authStoreMock: IAuthStorePort;
  let router: Router;

  function setupStore(state: {
    isAuthenticated: boolean;
    mustChangePassword: boolean;
  }) {
    authStoreMock = {
      isAuthenticated: signal(state.isAuthenticated),
      isLoading: signal(false),
      error: signal(null),
      mustChangePassword: signal(state.mustChangePassword),
      currentUsername: signal(''),
      checkSession: vi.fn().mockResolvedValue(undefined),
      login: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.resetTestingModule();

    return TestBed.configureTestingModule({
      imports: [NotFoundRedirect],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: authStoreMock },
      ],
    }).compileComponents();
  }

  beforeEach(async () => {
    await setupStore({ isAuthenticated: false, mustChangePassword: false });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  it('should redirect unauthenticated users to /auth', () => {
    TestBed.createComponent(NotFoundRedirect);

    expect(router.navigate).toHaveBeenCalledWith(['/auth']);
  });

  it('should redirect authenticated users to /overview', async () => {
    await setupStore({ isAuthenticated: true, mustChangePassword: false });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.createComponent(NotFoundRedirect);

    expect(router.navigate).toHaveBeenCalledWith(['/overview']);
  });

  it('should redirect users that must change password to /auth/update-password', async () => {
    await setupStore({ isAuthenticated: true, mustChangePassword: true });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    TestBed.createComponent(NotFoundRedirect);

    expect(router.navigate).toHaveBeenCalledWith(['/auth/update-password']);
  });
});
