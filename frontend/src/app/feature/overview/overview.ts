import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  OnInit,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { HeaderComponent } from '../../shared/headers/header';
import { Title } from '@angular/platform-browser';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { CardComponent } from '../../shared/cards/card.component';
import {
  BarChartCardComponent,
  ChartItem,
} from '../../shared/cards/bar-chart-card.component';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';
import { IScoreHistoryEntity } from '../../core/domain/entities/score-history.entity';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    CardComponent,
    BarChartCardComponent,
    AccessDeniedCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.html',
})
export class OverviewPage implements OnInit {
  private readonly titleService = inject(Title);
  private readonly usersStore = inject(USERS_STORE_PORT);
  private readonly unitsStore = inject(UNITS_STORE_PORT);
  private readonly scoreHistoryStore = inject(SCORE_HISTORY_STORE_PORT);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly currentUserEntity = this.usersStore.userCurrentEntity;

  readonly chartItems = computed<ChartItem[]>(() =>
    this.unitsStore.unitsList().map((unit) => ({
      id: unit.id,
      label: unit.name,
      value: unit.score,
    })),
  );

  readonly totalUnitsCount = computed(
    () => this.scoreHistoryStore.unitsOptions().length,
  );

  readonly unitNameMap = computed(() => {
    const map = new Map<string, string>();
    for (const unit of this.unitsStore.unitsList()) {
      map.set(unit.id, unit.name);
    }
    return map;
  });

  readonly pendingItemsWithUnitName = computed(() => {
    const map = this.unitNameMap();
    return this.scoreHistoryStore.pendingHistories().map((item) => ({
      ...item,
      unitName: map.get(item.unitId) || 'Unidade desconhecida',
      requestedByName: item.requestedBy?.username || 'Usuário desconhecido',
    }));
  });

  constructor() {
    effect(() => {
      this.usersStore.userCurrentEntity();
      this.unitsStore.unitsList();
      this.scoreHistoryStore.pendingHistories();
      this.cdr.markForCheck();
    });
  }

  readonly EPermission = EPermission;

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Visão Geral');
    void this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.scoreHistoryStore.fetchPendingScoreHistories(),
        this.scoreHistoryStore.fetchAllUnitsOptions(),
        this.unitsStore.fetchAllUnits(),
      ]);
    } catch {
      // tratado na store
    }
  }

  async onApprove(id: string): Promise<void> {
    try {
      await this.scoreHistoryStore.approveScoreHistory(id);
      await this.unitsStore.fetchAllUnits();
    } catch {
      // Tratado na store
    }
  }

  async onReject(id: string): Promise<void> {
    try {
      await this.scoreHistoryStore.rejectScoreHistory(id);
    } catch {
      // Tratado na store
    }
  }

  trackById(_index: number, record: IScoreHistoryEntity): string {
    return record.id;
  }
}
