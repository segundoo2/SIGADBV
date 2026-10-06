import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
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
import { TableCardComponent } from '../../shared/cards/table-card.component';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';

interface PendingScoreRow {
  readonly id: string;
  readonly unitName: string;
  readonly score: number;
  readonly description: string;
  readonly createdAt: Date;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    HeaderComponent,
    CardComponent,
    BarChartCardComponent,
    TableCardComponent,
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

  readonly pendingRows = signal<PendingScoreRow[]>([]);
  readonly totalUnitsCount = computed(() => this.unitsStore.unitsList().length);

  constructor() {
    effect(() => {
      this.usersStore.userCurrentEntity();
      this.unitsStore.unitsList();
      this.cdr.markForCheck();
    });
  }

  readonly EPermission = EPermission;

  private async loadPendingHistories(): Promise<void> {
    try {
      const historyItems = await this.scoreHistoryStore.fetchPendingScoreHistories();

      const sortedItems = [...historyItems].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const mappedRows: PendingScoreRow[] = sortedItems.map((item) => ({
        id: item.id,
        unitName: item.unit?.name ?? 'Unidade desconhecida',
        score: item.score,
        description: item.description,
        createdAt: new Date(item.createdAt),
      }));

      this.pendingRows.set(mappedRows);
    } catch {
      this.pendingRows.set([]);
    }
  }

  async approve(scoreHistoryId: string): Promise<void> {
    try {
      await this.scoreHistoryStore.approveScore(scoreHistoryId);
      await Promise.all([this.loadPendingHistories(), this.unitsStore.fetchAllUnits()]);
    } catch {
      // O erro é tratado na store
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Visão Geral');
    void this.loadUnits();
    void this.loadPendingHistories();
  }

  private async loadUnits(): Promise<void> {
    try {
      await this.unitsStore.fetchAllUnits();
    } catch {
      // O erro fica registrado na store.
    }
  }

  trackById(_index: number, record: PendingScoreRow): string {
    return record.id;
  }
}