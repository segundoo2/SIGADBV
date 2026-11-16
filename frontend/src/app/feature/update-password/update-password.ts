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
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';

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
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './update-password.html',
})
export class PasswordUpdatePage {
  private readonly usersStore = inject(USERS_STORE_PORT);
  private readonly titleService = inject(Title);
  private readonly router = inject(Router);

  private readonly _updatePasswordForm = new FormGroup(
    {
      password: new FormControl('', [
        Validators.required.bind(Validators),
        Validators.minLength(8),
        Validators.maxLength(12),
      ]),
      confirmPassword: new FormControl('', [
        Validators.required.bind(Validators),
      ]),
    },
    { validators: passwordMatchValidator },
  );

  constructor() {
    effect(() => {
      if (this.usersStore.isLoading()) {
        this._updatePasswordForm.disable();
      } else {
        this._updatePasswordForm.enable();
      }
    });

    effect(() => {
      if (this.usersStore.successMessage()) {
        void this.router.navigate(['/overview']);
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
    return this.usersStore.isLoading();
  }

  get errorMessage(): string | null {
    return this.usersStore.error();
  }

  onSubmit(): void {
    if (this._updatePasswordForm.invalid) {
      return;
    }

    const { password } = this._updatePasswordForm.value;
    if (!password) {
      return;
    }

    void this.usersStore.updatePassword({
      password: password,
    });
  }
}
