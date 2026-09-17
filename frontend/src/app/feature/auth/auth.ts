import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, effect, inject } from '@angular/core';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { Title } from '@angular/platform-browser';
import { InputFormComponent } from '../../shared/inputs/input-form/input-form';

@Component({
  imports: [ReactiveFormsModule, InputFormComponent],
  selector: 'app-auth',
  templateUrl: './auth.html',
})
export class Auth {
  private readonly authStore = inject(AUTH_STORE_PORT);
  private titleService = inject(Title);
  
  private readonly _loginForm = new FormGroup({
    username: new FormControl('', [Validators.required, Validators.minLength(3)]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  constructor() {
    effect(() => {
      if(this.authStore.isLoading()) {
        this._loginForm.disable()
      } else {
        this._loginForm.enable();
      }
    });
  }

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Acessar Sistema');
  }

  get loginForm(): FormGroup {
    return this._loginForm
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
      this.authStore.login({ username: username!, password: password! })
  }
}
