import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { InputFormComponent } from '../../shared/inputs/input-form';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { ButtonComponent } from '../../shared/buttons/button.component';
import { UPDATE_PASSWORD_STORE_PORT } from '../../core/infra/tokens/update-password.token';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';

// Validador customizado para comparar os campos de senha
function passwordMatchValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  imports: [
    ReactiveFormsModule,
    InputFormComponent,
    ErrorMessageComponent,
    ButtonComponent,
  ],
  selector: 'app-update-password',
  templateUrl: './update-password.html',
})
export class UpdatePassword {
  private readonly updatePasswordStore = inject(UPDATE_PASSWORD_STORE_PORT);
  private readonly authStore = inject(AUTH_STORE_PORT);
  private readonly titleService = inject(Title);
  private readonly router = inject(Router);

  private readonly _updatePasswordForm = new FormGroup(
    {
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
      ]),
      confirmPassword: new FormControl('', [Validators.required]),
    },
    { validators: passwordMatchValidator },
  );

  constructor() {
    effect(() => {
      if (this.updatePasswordStore.isLoading()) {
        this._updatePasswordForm.disable();
      } else {
        this._updatePasswordForm.enable();
      }
    });

    effect(() => {
      if (this.updatePasswordStore.successMessage()) {
        this.router.navigate(['/overview']);
      }
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Atualizar Senha');
  }

  get updatePasswordForm(): FormGroup {
    return this._updatePasswordForm;
  }

  get isLoading(): boolean {
    return this.updatePasswordStore.isLoading();
  }

  get errorMessage(): string | null {
    return this.updatePasswordStore.error();
  }

  onSubmit(): void {
    if (this._updatePasswordForm.invalid) {
      return;
    }

    const { password } = this._updatePasswordForm.value;
    const currentUsername = this.authStore.currentUsername();

    this.updatePasswordStore.updatePassword({
      username: currentUsername,
      password: password!,
      mustChangePassword: false,
    });
  }
}
