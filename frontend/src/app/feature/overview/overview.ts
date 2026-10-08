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
import { LucideAngularModule } from 'lucide-angular';
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
import { IScoreHistoryEntity } from '../../core/domain/entities/score-history.entity';

interface ScoreHistoryRow {
  readonly id: string;
  readonly score: number;
  readonly description: string;
  readonly instructor: string;
  readonly createdAt: Date;
}

interface ExtendedScoreHistoryItem extends IScoreHistoryEntity {
  readonly instructor?: string;
  readonly userName?: string;
  readonly user?: { readonly username?: string };
}

interface ScoreHistoryStoreWithActions {
  readonly fetchPendingScoreHistory?: (
    limit?: number,
  ) => Promise<IScoreHistoryEntity[]>;
  readonly fetchUnitScoreHistory?: (
    unitId?: string,
    limit?: number,
  ) => Promise<IScoreHistoryEntity[]>;
  readonly approveScore?: (id: string) => Promise<void>;
  readonly rejectScore?: (id: string) => Promise<void>;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    LucideAngularModule,
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
  private readonly scoreHistoryStore = inject(
    SCORE_HISTORY_STORE_PORT,
  ) as unknown as ScoreHistoryStoreWithActions;
  private readonly cdr = inject(ChangeDetectorRef);

  readonly currentUserEntity = this.usersStore.userCurrentEntity;

  readonly chartItems = computed<ChartItem[]>(() =>
    this.unitsStore.unitsList().map((unit) => ({
      id: unit.id,
      label: unit.name,
      value: unit.score,
    })),
  );

  readonly historyRows = signal<ScoreHistoryRow[]>([]);
  readonly totalUnitsCount = computed(() => this.unitsStore.unitsList().length);

  constructor() {
    effect(() => {
      this.usersStore.userCurrentEntity();
      this.unitsStore.unitsList();
      this.cdr.markForCheck();
    });
  }

  readonly EPermission = EPermission;

  private async loadHistory(): Promise<void> {
    try {
      let historyItems: IScoreHistoryEntity[] = [];
      if (
        typeof this.scoreHistoryStore.fetchPendingScoreHistory === 'function'
      ) {
        historyItems =
          await this.scoreHistoryStore.fetchPendingScoreHistory(10);
      } else if (
        typeof this.scoreHistoryStore.fetchUnitScoreHistory === 'function'
      ) {
        historyItems = await this.scoreHistoryStore.fetchUnitScoreHistory(
          undefined,
          10,
        );
      }

      const sortedItems = [...historyItems].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const mappedRows: ScoreHistoryRow[] = sortedItems.map((item) => {
        const ext = item as ExtendedScoreHistoryItem;
        const instructor =
          ext.instructor ?? ext.userName ?? ext.user?.username ?? 'Instrutor';
        return {
          id: item.id,
          score: item.score,
          description: item.description,
          instructor,
          createdAt: new Date(item.createdAt),
        };
      });
      this.historyRows.set(mappedRows);
    } catch {
      this.historyRows.set([]);
    }
  }

  async approveScore(id: string): Promise<void> {
    try {
      if (typeof this.scoreHistoryStore.approveScore === 'function') {
        await this.scoreHistoryStore.approveScore(id);
      }
      await this.loadHistory();
    } catch {
      // Tratamento de erro
    }
  }

  async rejectScore(id: string): Promise<void> {
    try {
      if (typeof this.scoreHistoryStore.rejectScore === 'function') {
        await this.scoreHistoryStore.rejectScore(id);
      }
      await this.loadHistory();
    } catch {
      // Tratamento de erro
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Visão Geral');
    void this.loadUnits();
    void this.loadHistory();
  }

  private async loadUnits(): Promise<void> {
    try {
      await this.unitsStore.fetchAllUnits();
    } catch {
      // O erro fica registrado na store.
    }
  }

  trackById(_index: number, record: ScoreHistoryRow): string {
    return record.id;
  }
}
