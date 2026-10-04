import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Component, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { Title } from '@angular/platform-browser';
import { InputFormComponent } from '../../shared/inputs/input-form';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { ButtonComponent } from '../../shared/buttons/button.component';

@Component({
  imports: [
    ReactiveFormsModule,
    InputFormComponent,
    ErrorMessageComponent,
    ButtonComponent,
  ],
  selector: 'app-auth',
  templateUrl: './auth.html',
})
export class Auth {
  private readonly authStore = inject(AUTH_STORE_PORT);
  private readonly titleService = inject(Title);
  private readonly router = inject(Router);

  private readonly _loginForm = new FormGroup({
    username: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
    ]),
  });

  constructor() {
    effect(() => {
      if (this.authStore.isLoading()) {
        this._loginForm.disable();
      } else {
        this._loginForm.enable();
      }
    });

    effect(() => {
      if (this.authStore.isAuthenticated()) {
        if (this.authStore.mustChangePassword()) {
          this.router.navigate(['/auth/update-password']);
        } else {
          this.router.navigate(['/overview']);
        }
      }
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Acessar Sistema');
  }

  get loginForm(): FormGroup {
    return this._loginForm;
  }

  get isLoading(): boolean {
    return this.authStore.isLoading();
  }

  get errorMessage(): string | null {
    return this.authStore.error();
  }

  onSubmit(): void {
    if (this._loginForm.invalid) {
      return;
    }

    const { username, password } = this._loginForm.value;
    this.authStore.login({ username: username!, password: password! });
  }
}
