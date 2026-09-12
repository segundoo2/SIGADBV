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

  it('deve permitir o acesso à rota quando o usuário estiver autenticado', () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBe(true);
    expect(routerMock.createUrlTree).not.toHaveBeenCalled();
  });

  it('deve redirecionar para /auth/login quando o usuário não estiver autenticado', () => {
    vi.mocked(authStoreMock.isAuthenticated).mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(routerMock.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toEqual(['/auth/login']);
  });
});