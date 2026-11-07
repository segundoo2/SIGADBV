import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EUnitGender } from '../../core/domain/enums/unit-gender.enum';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { HeaderComponent } from '../../shared/headers/header';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { UnitScoreManagerComponent } from './components/unit-score-manager.component';
import { UnitScoreHistoryModalComponent } from './components/unit-score-history-modal.component';
import { Title } from '@angular/platform-browser';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { IUnitEntity } from '../../core/domain/entities/unit.entity';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ErrorMessageComponent,
    UnitScoreManagerComponent,
    UnitScoreHistoryModalComponent,
    AccessDeniedCard,
  ],
  selector: 'app-units',
  templateUrl: './units.html',
})
export class UnitsPage implements OnInit {
  private readonly titleService = inject(Title);
  protected readonly unitsStore = inject(UNITS_STORE_PORT);
  private readonly usersStore = inject(USERS_STORE_PORT);

  protected readonly EPermission = EPermission;
  readonly isHistoryModalOpen = signal<boolean>(false);
  readonly selectedUnit = signal<IUnitEntity | null>(null);

  protected readonly genderLabels: Record<EUnitGender, string> = {
    [EUnitGender.MALE]: 'Desbravadores',
    [EUnitGender.FEMALE]: 'Desbravadoras',
    [EUnitGender.MIXED]: 'Mista',
  };

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Unidades');
    if (this.userHasPermission(EPermission.UNIT_READ)) {
      void this.unitsStore.fetchAllUnits();
    }
  }

  openHistoryModal(unit: IUnitEntity): void {
    this.selectedUnit.set(unit);
    this.isHistoryModalOpen.set(true);
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
    this.selectedUnit.set(null);
  }

  private userHasPermission(permission: EPermission): boolean {
    const user = this.usersStore.userCurrentEntity();
    return (
      user?.roles.some((role) => role.permissions.includes(permission)) ?? false
    );
  }
}
