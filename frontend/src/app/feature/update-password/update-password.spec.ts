import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordUpdatePage } from './update-password';
import { UPDATE_PASSWORD_STORE_PORT } from '../../core/infra/tokens/update-password.token';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { provideRouter, Router } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { IAuthStorePort } from '../../core/application/ports/stores/auth-store.port';

describe('PasswordUpdatePage', () => {
  let component: PasswordUpdatePage;
  let fixture: ComponentFixture<PasswordUpdatePage>;
  let mockUpdatePasswordStore: {
    isLoading: WritableSignal<boolean>;
    error: WritableSignal<string | null>;
    successMessage: WritableSignal<string>;
    updatePassword: ReturnType<typeof vi.fn>;
  };
  let mockAuthStore: IAuthStorePort;
  let router: Router;
  let titleService: Title;

  beforeEach(async () => {
    // Mocks dos signals e métodos das stores usando Vitest
    mockUpdatePasswordStore = {
      isLoading: signal(false),
      error: signal<string | null>(null),
      successMessage: signal(''),
      updatePassword: vi.fn(),
    };

    mockAuthStore = {
      isAuthenticated: signal(true),
      isLoading: signal(false),
      error: signal(null),
      mustChangePassword: signal(true),
      currentUserEntity: signal({
        id: 'test-user',
        tenantId: 'test-tenant',
        username: 'testuser',
        mustChangePassword: true,
        roles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      restoreAuthenticationSession: vi.fn().mockResolvedValue(undefined),
      login: vi.fn(),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PasswordUpdatePage],
      providers: [
        provideRouter([]),
        {
          provide: UPDATE_PASSWORD_STORE_PORT,
          useValue: mockUpdatePasswordStore,
        },
        { provide: AUTH_STORE_PORT, useValue: mockAuthStore },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    titleService = TestBed.inject(Title);

    // Espiona o método navigate do router para validar redirecionamentos
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    // Espiona a definição do título
    vi.spyOn(titleService, 'setTitle');

    fixture = TestBed.createComponent(PasswordUpdatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and set the page title on init', () => {
    expect(component).toBeTruthy();
    expect(titleService.setTitle).toHaveBeenCalledWith(
      'SIGADBV - Atualizar Senha',
    );
  });

  it('should invalidate form if passwords do not match', () => {
    const form = component.updatePasswordForm;

    form.controls['password'].setValue('12345678');
    form.controls['confirmPassword'].setValue('87654321');

    expect(form.invalid).toBe(true);
    expect(form.hasError('mismatch')).toBe(true);
  });

  it('should validate form if passwords match and meet min length', () => {
    const form = component.updatePasswordForm;

    form.controls['password'].setValue('12345678');
    form.controls['confirmPassword'].setValue('12345678');

    expect(form.valid).toBe(true);
    expect(form.hasError('mismatch')).toBe(false);
  });

  it('should call updatePassword store method on valid submit using authStore username', () => {
    const form = component.updatePasswordForm;
    form.controls['password'].setValue('12345678');
    form.controls['confirmPassword'].setValue('12345678');

    component.onSubmit();

    expect(mockUpdatePasswordStore.updatePassword).toHaveBeenCalledWith({
      username: 'testuser',
      password: '12345678',
      mustChangePassword: false,
    });
  });

  it('should not call updatePassword if form is invalid', () => {
    const form = component.updatePasswordForm;
    form.controls['password'].setValue('123'); // Menor que 8 caracteres
    form.controls['confirmPassword'].setValue('123');

    component.onSubmit();

    expect(mockUpdatePasswordStore.updatePassword).not.toHaveBeenCalled();
  });

  it('should disable form controls when store is loading', () => {
    mockUpdatePasswordStore.isLoading.set(true);
    fixture.detectChanges();

    expect(component.updatePasswordForm.disabled).toBe(true);
  });

  it('should enable form controls when store finishes loading', () => {
    // Primeiro bota em loading
    mockUpdatePasswordStore.isLoading.set(true);
    fixture.detectChanges();
    expect(component.updatePasswordForm.disabled).toBe(true);

    // Depois tira do loading
    mockUpdatePasswordStore.isLoading.set(false);
    fixture.detectChanges();
    expect(component.updatePasswordForm.enabled).toBe(true);
  });

  it('should navigate to overview when successMessage is emitted', () => {
    expect(router.navigate).not.toHaveBeenCalled();

    // Emite uma mensagem de sucesso na store
    mockUpdatePasswordStore.successMessage.set('Senha atualizada com sucesso!');
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/overview']);
  });
});
