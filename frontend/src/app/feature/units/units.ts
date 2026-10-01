import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { HeaderComponent } from '../../shared/headers/header';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { UnitScoreManagerComponent } from '../../shared/sections/unit-score-manager.component';
import { Title } from '@angular/platform-browser';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ErrorMessageComponent,
    UnitScoreManagerComponent,
  ],
  selector: 'app-units',
  templateUrl: './units.html',
})
export class Units implements OnInit {
  private readonly titleService = inject(Title);
  protected readonly unitsStore = inject(UNITS_STORE_PORT);
  
  async ngOnInit(): Promise<void> {
    this.titleService.setTitle('SIGADBV - Unidades');
    await this.loadUnits();
  }

  private async loadUnits(): Promise<void> {
    try {
      await this.unitsStore.getAllUnits();
    } catch {
      // O erro é tratado e armazenado na store
    }
  }
}