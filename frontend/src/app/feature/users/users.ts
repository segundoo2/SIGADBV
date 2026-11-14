import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { HeaderComponent } from '../../shared/headers/header';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';
import { ModalComponent } from '../../shared/modals/modal.component';
import { InputFormComponent } from '../../shared/inputs/input-form';
import { SelectFormComponent } from '../../shared/selects/select-form.component';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { ADMIN_STORE_PORT } from '../../core/infra/tokens/admin.token';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { UserEntity } from '../../core/domain/entities/user.entity';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderComponent,
    AccessDeniedCard,
    ModalComponent,
    InputFormComponent,
    SelectFormComponent,
    ErrorMessageComponent,
  ],
  templateUrl: './users.html',
})
export class UsersPage implements OnInit {
  private readonly titleService = inject(Title);
  private readonly usersStore = inject(USERS_STORE_PORT);
  protected readonly adminStore = inject(ADMIN_STORE_PORT);

  protected readonly EPermission = EPermission;
  protected readonly copied = signal(false);

  readonly createUsername = new FormControl('', {
    nonNullable: true,
    validators: [
      (control) => Validators.required(control),
      (control) => Validators.pattern(/^[a-z0-9]+(?:\.[a-z0-9]+)+$/)(control),
    ],
  });

  readonly createRoleId = new FormControl('', {
    nonNullable: true,
    validators: [(control) => Validators.required(control)],
  });

  readonly roleOptions = computed(() =>
    this.adminStore.roles().map((role) => ({ id: role.id, name: role.name })),
  );

  readonly canReadUsers = computed(() =>
    this.userHasPermission(EPermission.USERS_READ),
  );

  readonly canCreateUsers = computed(
    () =>
      this.userHasPermission(EPermission.USERS_CREATE) && this.canReadRoles(),
  );

  readonly canResetPasswords = computed(() =>
    this.userHasPermission(EPermission.USERS_UPDATE),
  );

  readonly canReadRoles = computed(() =>
    this.userHasPermission(EPermission.ROLES_READ),
  );

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Gestão de Usuários');
    void this.adminStore
      .loadData({
        canReadUsers: this.canReadUsers(),
        canReadRoles: this.canReadRoles(),
        canCreateRoles: false,
      })
      .catch(() => undefined);
  }

  openCreateUser(): void {
    this.createUsername.reset('');
    this.createRoleId.reset('');
    this.adminStore.openCreateUser();
  }

  async openResetPassword(username: string): Promise<void> {
    try {
      await this.adminStore.resetTemporaryPassword(username);
    } catch {
      // O erro é mantido na store para apresentação pela página.
    }
  }

  closeModal(): void {
    this.adminStore.closeModal();
  }

  async copyPassword(): Promise<void> {
    const password = this.adminStore.temporaryPassword();
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      this.copied.set(true);
      setTimeout(() => {
        this.copied.set(false);
      }, 2000);
    } catch {
      // Tratamento silencioso caso a API de clipboard seja bloqueada
    }
  }

  async submitUser(): Promise<void> {
    this.createUsername.markAsTouched();
    this.createRoleId.markAsTouched();
    if (this.createUsername.invalid || this.createRoleId.invalid) return;
    try {
      await this.adminStore.createUser({
        username: this.createUsername.value.trim(),
        roleIds: [this.createRoleId.value],
      });
    } catch {
      // O erro é mantido na store para apresentação pela página.
    }
  }

  trackById(_index: number, item: UserEntity): string {
    return item.id;
  }

  private userHasPermission(permission: EPermission): boolean {
    return (
      this.usersStore
        .userCurrentEntity()
        ?.roles.some((role) => role.permissions.includes(permission)) ?? false
    );
  }
}
