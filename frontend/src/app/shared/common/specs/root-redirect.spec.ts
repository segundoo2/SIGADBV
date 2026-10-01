import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { RootRedirect } from '../root-redirect';
import { AUTH_STORE_PORT } from '../../../core/infra/tokens/auth.token';
import { IAuthStorePort } from '../../../core/domain/ports/stores/auth-store.port';

describe('RootRedirect', () => {
  let fixture: ComponentFixture<RootRedirect>;
  let authStoreMock: IAuthStorePort;
  let router: Router;
  let isAuthenticated: WritableSignal<boolean>;
  let mustChangePassword: WritableSignal<boolean>;

  beforeEach(async () => {
    isAuthenticated = signal(false);
    mustChangePassword = signal(false);

    authStoreMock = {
      isAuthenticated,
      isLoading: signal(false),
      error: signal(null),
      mustChangePassword,
      currentUsername: signal(''),
      checkSession: vi.fn().mockResolvedValue(undefined),
      login: vi.fn(),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RootRedirect],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: authStoreMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(RootRedirect);
  });

  it('should redirect unauthenticated users to /auth without checking the session', async () => {
    await fixture.componentInstance.ngOnInit();

    expect(authStoreMock.checkSession).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth'], {
      replaceUrl: true,
    });
  });

  it('should redirect authenticated users to /overview without checking session', async () => {
    isAuthenticated.set(true);
    mustChangePassword.set(false);

    await fixture.componentInstance.ngOnInit();

    expect(authStoreMock.checkSession).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/overview'], {
      replaceUrl: true,
    });
  });

  it('should redirect authenticated users that must change password to /auth/update-password', async () => {
    isAuthenticated.set(true);
    mustChangePassword.set(true);

    await fixture.componentInstance.ngOnInit();

    expect(authStoreMock.checkSession).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/update-password'], {
      replaceUrl: true,
    });
  });
});
