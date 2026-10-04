import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { App } from './app';
import { AUTH_STORE_PORT } from './core/infra/tokens/auth.token';
import { IAuthStorePort } from './core/application/ports/stores/auth-store.port';

describe('App', () => {
  let authStoreMock: IAuthStorePort;

  beforeEach(async () => {
    authStoreMock = {
      isAuthenticated: signal(false),
      isLoading: signal(false),
      error: signal(null),
      mustChangePassword: signal(false),
      currentUserEntity: () => null,
      restoreAuthenticationSession: vi.fn().mockResolvedValue(undefined),
      login: vi.fn(),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: authStoreMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should restore the authentication session through authStore on init', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(authStoreMock.restoreAuthenticationSession).toHaveBeenCalledTimes(1);
  });
});
