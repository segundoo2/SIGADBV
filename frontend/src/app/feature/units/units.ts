import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EUnitGender } from '../../core/domain/enums/unit-gender.enum';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { HeaderComponent } from '../../shared/headers/header';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { UnitScoreManagerComponent } from '../../shared/sections/unit-score-manager.component';
import { Title } from '@angular/platform-browser';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';
import { EPermission } from '../../core/domain/enums/permissions.enum'; // 1. Importar o enum de permissões

@Component({
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ErrorMessageComponent,
    UnitScoreManagerComponent,
    AccessDeniedCard,
  ],
  selector: 'app-units',
  templateUrl: './units.html',
})
export class UnitsPage implements OnInit {
  private readonly titleService = inject(Title);
  protected readonly unitsStore = inject(UNITS_STORE_PORT);

  // 2. Expor o enum para o template HTML conseguir utilizá-lo
  protected readonly EPermission = EPermission;

  protected readonly genderLabels: Record<EUnitGender, string> = {
    [EUnitGender.MALE]: 'Desbravadores',
    [EUnitGender.FEMALE]: 'Desbravadoras',
    [EUnitGender.MIXED]: 'Mista',
  };

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Unidades');
    void this.loadUnits();
  }

  private async loadUnits(): Promise<void> {
    try {
      await this.unitsStore.fetchAllUnits();
    } catch {
      // O erro é tratado e armazenado na store
    }
  }
}
