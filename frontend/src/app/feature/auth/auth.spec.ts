import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Auth } from './auth';
import { IAuthStorePort } from '../../core/domain/ports/auth-store.port';
import { signal, WritableSignal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { describe, beforeEach, it, expect, vi } from 'vitest';

describe('Auth', () => {
  let component: Auth;
  let fixture: ComponentFixture<Auth>;
  let authStoreMock: IAuthStorePort;
  let router: Router;

  beforeEach(async () => {
    authStoreMock = {
      isAuthenticated: signal(false),
      isLoading: signal(false),
      error: signal(null),
      mustChangePassword: signal(false),
      login: vi.fn(),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Auth],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: authStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Auth);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create the component successfully', () => {
    expect(component).toBeTruthy();
  });

  it('should render the Desbravadores logo image with correct attributes', () => {
    const compiled = fixture.nativeElement;
    const logoImg = compiled.querySelector('img[alt="Logo Desbravadores"]');

    expect(logoImg).toBeTruthy();
    expect(logoImg.getAttribute('src')).toBe('/D3.png');
  });

  it('should render the system title SIGADBV', () => {
    const compiled = fixture.nativeElement;
    const title = compiled.querySelector('h1');

    expect(title).toBeTruthy();
    expect(title.textContent?.trim()).toBe('SIGADBV');
  });

  it('should render the username input with the correct data-testid', () => {
    const compiled = fixture.nativeElement;
    const usernameInput = compiled.querySelector('[data-testid="username-input"]');

    expect(usernameInput).toBeTruthy();
  });

  it('should render the password input with the correct data-testid', () => {
    const compiled = fixture.nativeElement;
    const passwordInput = compiled.querySelector('[data-testid="password-input"]');

    expect(passwordInput).toBeTruthy();
  });

  it('should render the submit button with the correct data-testid', () => {
    const compiled = fixture.nativeElement;
    const submitButton = compiled.querySelector('[data-testid="submit-btn"]');

    expect(submitButton).toBeTruthy();
  });

  it('should initialize the form with empty username and password fields and invalid status', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.valid).toBeFalsy();
  });

  const loginData = {
    username: 'edilson.segundo',
    password: 'test-password',
  };

  it('should call the auth store login method with form values on submit', () => {
    component.loginForm.setValue(loginData);

    const compiled = fixture.nativeElement;
    const form = compiled.querySelector('[data-testid="form-auth"]');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStoreMock.login).toHaveBeenCalledWith(loginData);
  });

  it('should disable the form controls and submit button when store is loading', () => {
    (authStoreMock.isLoading as WritableSignal<boolean>).set(true);
    fixture.detectChanges();

    expect(component.loginForm.disabled).toBeTruthy();
    const compiled = fixture.nativeElement;
    const submitButton = compiled.querySelector('[data-testid="submit-btn"]');
    expect(submitButton.disabled).toBeTruthy();
  });

  it('should mark fields as invalid when left empty', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');

    usernameControl?.setValue('');
    passwordControl?.setValue('');

    expect(usernameControl?.valid).toBeFalsy();
    expect(passwordControl?.valid).toBeFalsy();
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should not call the auth store login method if the form is invalid on submit', () => {
    component.loginForm.setValue({
      username: '',
      password: '',
    });

    const compiled = fixture.nativeElement;
    const form = compiled.querySelector('[data-testid="form-auth"]');
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(authStoreMock.login).not.toHaveBeenCalled();
  });

  it('should render the error message when store has an error', () => {
    (authStoreMock.error as WritableSignal<string | null>).set('Ops! Credenciais inválidas');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const errorMessage = compiled.querySelector('[data-testid="error-message"]');

    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toContain('Ops! Credenciais inválidas');
  });

  it('should mark the password control as invalid if it is too short', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('1234567');

    expect(passwordControl?.valid).toBeFalsy();
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should mark the username control as invalid if it is too short', () => {
    const usernameControl = component.loginForm.get('username');
    usernameControl?.setValue('ab');

    expect(usernameControl?.valid).toBeFalsy();
    expect(component.loginForm.valid).toBeFalsy();
  });

  it('should redirect to /dashboard when authenticated and password change is not required', () => {
    (authStoreMock.mustChangePassword as WritableSignal<boolean>).set(false);
    (authStoreMock.isAuthenticated as WritableSignal<boolean>).set(true);
    TestBed.flushEffects();

    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should redirect to /auth/define-password when authenticated and password change is required', () => {
    (authStoreMock.mustChangePassword as WritableSignal<boolean>).set(true);
    (authStoreMock.isAuthenticated as WritableSignal<boolean>).set(true);
    TestBed.flushEffects();

    expect(router.navigate).toHaveBeenCalledWith(['/auth/define-password']);
  });
});