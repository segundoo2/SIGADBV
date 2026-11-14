import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RoleEntity } from '../../core/domain/entities/role.entity';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { ADMIN_STORE_PORT } from '../../core/infra/tokens/admin.token';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { ModalComponent } from '../../shared/modals/modal.component';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { HeaderComponent } from '../../shared/headers/header';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';
import { InputFormComponent } from '../../shared/inputs/input-form';

interface IPermissionGroup {
  title: string;
  permissions: EPermission[];
}

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    ErrorMessageComponent,
    HeaderComponent,
    AccessDeniedCard,
    InputFormComponent,
  ],
  templateUrl: './roles.html',
})
export class RolesPage implements OnInit {
  private readonly titleService = inject(Title);
  private readonly usersStore = inject(USERS_STORE_PORT);
  protected readonly adminStore = inject(ADMIN_STORE_PORT);

  protected readonly EPermission = EPermission;

  readonly permissionGroups: IPermissionGroup[] = [
    {
      title: 'Usuários',
      permissions: [
        EPermission.USERS_CREATE,
        EPermission.USERS_READ,
        EPermission.USERS_UPDATE,
        EPermission.USERS_DELETE,
      ],
    },
    {
      title: 'Produtos',
      permissions: [
        EPermission.PRODUCTS_CREATE,
        EPermission.PRODUCTS_READ,
        EPermission.PRODUCTS_UPDATE,
        EPermission.PRODUCTS_DELETE,
      ],
    },
    {
      title: 'Categorias',
      permissions: [
        EPermission.CATEGORIES_CREATE,
        EPermission.CATEGORIES_READ,
        EPermission.CATEGORIES_UPDATE,
        EPermission.CATEGORIES_DELETE,
      ],
    },
    {
      title: 'Cargos',
      permissions: [
        EPermission.ROLES_CREATE,
        EPermission.ROLES_READ,
        EPermission.ROLES_UPDATE,
        EPermission.ROLES_DELETE,
      ],
    },
    {
      title: 'Localizações',
      permissions: [
        EPermission.LOCATION_CREATE,
        EPermission.LOCATION_READ,
        EPermission.LOCATION_UPDATE,
        EPermission.LOCATION_DELETE,
      ],
    },
    {
      title: 'Movimentações',
      permissions: [
        EPermission.MOVEMENT_REGISTER,
        EPermission.MOVEMENT_ALLOCATE,
        EPermission.MOVEMENT_READ,
      ],
    },
    {
      title: 'Unidades',
      permissions: [
        EPermission.UNIT_CREATE,
        EPermission.UNIT_READ,
        EPermission.UNIT_UPDATE,
        EPermission.UNIT_DELETE,
      ],
    },
    {
      title: 'Métricas e Histórico',
      permissions: [
        EPermission.METRICS,
        EPermission.SCORE_HISTORY_ADJUST,
        EPermission.SCORE_HISTORY_APPROVE,
        EPermission.SCORE_HISTORY_READ,
      ],
    },
  ];

  readonly createRoleName = new FormControl('', {
    nonNullable: true,
    validators: [
      (control) => Validators.required(control),
      (control) => Validators.minLength(2)(control),
      (control) => Validators.maxLength(50)(control),
    ],
  });

  readonly canReadRoles = computed(() =>
    this.userHasPermission(EPermission.ROLES_READ),
  );

  readonly canCreateRoles = computed(() =>
    this.userHasPermission(EPermission.ROLES_CREATE),
  );

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Gerenciamento de Cargos');
    void this.adminStore
      .loadData({
        canReadUsers: false,
        canReadRoles: this.canReadRoles(),
        canCreateRoles: this.canCreateRoles(),
      })
      .catch(() => undefined);
  }

  openCreateRole(): void {
    this.createRoleName.reset('');
    this.adminStore.openCreateRole();
  }

  closeModal(): void {
    this.adminStore.closeModal();
  }

  togglePermission(permission: string, checked: boolean): void {
    this.adminStore.togglePermission(permission, checked);
  }

  toggleGroup(permissions: EPermission[]): void {
    const currentSelected = this.adminStore.selectedPermissions();
    const allAreSelected = permissions.every((p) =>
      currentSelected.includes(p),
    );

    permissions.forEach((p) => {
      if (allAreSelected) {
        if (currentSelected.includes(p)) {
          this.adminStore.togglePermission(p, false);
        }
      } else {
        if (!currentSelected.includes(p)) {
          this.adminStore.togglePermission(p, true);
        }
      }
    });
  }

  formatPermissionLabel(permission: string): string {
    const parts = permission.split('.');
    if (parts.length < 2) return permission;
    const action = parts[1];

    const mapAction: Record<string, string> = {
      create: 'Criar',
      read: 'Visualizar',
      update: 'Atualizar',
      delete: 'Excluir',
      register: 'Registrar',
      allocate: 'Alocar',
      adjust: 'Ajustar',
      approve: 'Aprovar',
    };

    return mapAction[action] ? `${mapAction[action]}` : permission;
  }

  async submitRole(): Promise<void> {
    this.createRoleName.markAsTouched();
    if (this.createRoleName.invalid) return;
    try {
      await this.adminStore.createRole({
        name: this.createRoleName.value.trim(),
        permissions: this.adminStore.selectedPermissions(),
      });
    } catch {
      // O erro é mantido na store para apresentação pela página.
    }
  }

  trackById(_index: number, item: RoleEntity): string {
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
