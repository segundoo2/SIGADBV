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
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { HeaderComponent } from '../../shared/headers/header';
import { Title } from '@angular/platform-browser';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { SelectOption } from '../../shared/selects/select-form.component';
import { CardComponent } from '../../shared/cards/card.component';
import {
  BarChartCardComponent,
  ChartItem,
} from '../../shared/cards/bar-chart-card.component';
import { TableCardComponent } from '../../shared/cards/table-card.component';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';

interface ScoreHistoryRow {
  readonly id: string;
  readonly score: number;
  readonly description: string;
  readonly createdAt: Date;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    ReactiveFormsModule,
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

  readonly unitOptions = computed<SelectOption[]>(() =>
    this.unitsStore.unitsList().map((unit) => ({
      id: unit.id,
      name: unit.name,
    })),
  );

  readonly chartItems = computed<ChartItem[]>(() =>
    this.unitsStore.unitsList().map((unit) => ({
      id: unit.id,
      label: unit.name,
      value: unit.score,
    })),
  );

  readonly unitControl = new FormControl<string>('', { nonNullable: true });
  readonly historyRows = signal<ScoreHistoryRow[]>([]);
  readonly totalUnitsCount = computed(
    () => this.scoreHistoryStore.unitsOptions().length,
  );

  constructor() {
    effect(() => {
      this.usersStore.userCurrentEntity();
      this.unitsStore.unitsList();
      this.cdr.markForCheck();
    });

    this.unitControl.valueChanges.subscribe((unitId) => {
      if (unitId) {
        void this.loadHistory(unitId);
      } else {
        this.historyRows.set([]);
      }
    });
  }

  readonly EPermission = EPermission;

  private async loadHistory(unitId: string): Promise<void> {
    try {
      const historyItems = await this.scoreHistoryStore.fetchUnitScoreHistory(
        unitId,
        10,
      );

      const sortedItems = [...historyItems].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      const mappedRows: ScoreHistoryRow[] = sortedItems.map((item) => ({
        id: item.id,
        score: item.score,
        description: item.description,
        createdAt: new Date(item.createdAt),
      }));
      this.historyRows.set(mappedRows);
    } catch {
      this.historyRows.set([]);
    }
  }

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Visão Geral');
    void this.loadUnits();
  }

  private async loadUnits(): Promise<void> {
    await this.scoreHistoryStore.fetchAllUnitsOptions();
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
