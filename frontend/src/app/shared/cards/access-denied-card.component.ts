import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { EPermission } from '../../core/domain/enums/permissions.enum';

@Component({
  selector: 'app-access-denied-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasPermission()) {
      <ng-content />
    } @else {
      <aside role="alert" class="p-6 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-sm text-center">
        {{ message }}
      </aside>
    }
  `
})
export class AccessDeniedCard {
  private readonly usersStore = inject(USERS_STORE_PORT);

  @Input() requiredPermission: EPermission | null = null;
  @Input() message: string = 'Você não possui permissão para visualizar este conteúdo.';

  protected hasPermission = (): boolean => {
    const perm = this.requiredPermission;
    if (!perm) return true;

    const user = this.usersStore.userCurrentEntity();
    if (!user || !user.roles) return false;

    return user.roles.some((role) => role.permissions.includes(perm));
  };
}