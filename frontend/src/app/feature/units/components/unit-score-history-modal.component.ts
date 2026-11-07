import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { IScoreHistoryEntity } from '../../../core/domain/entities/score-history.entity';
import { IUnitEntity } from '../../../core/domain/entities/unit.entity';
import {
  EScoreHistoryStatus,
  SCORE_HISTORY_STATUS_LABELS,
} from '../../../core/domain/enums/score-history-status.enum';
import { EUnitGender } from '../../../core/domain/enums/unit-gender.enum';
import { SCORE_HISTORY_STORE_PORT } from '../../../core/infra/tokens/score-history.token';
import { PDF_REPORT_PORT } from '../../../core/infra/tokens/pdf-report.token';
import { EPermission } from '../../../core/domain/enums/permissions.enum';
import { USERS_STORE_PORT } from '../../../core/infra/tokens/users.token';
import { AccessDeniedCard } from '../../../shared/cards/access-denied-card.component';
import { ModalComponent } from '../../../shared/modals/modal.component';
import { generateReportHtml } from '../../../shared/templates/unit-report.template';

@Component({
  selector: 'app-unit-score-history-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, AccessDeniedCard],
  templateUrl: './unit-score-history-modal.component.html',
})
export class UnitScoreHistoryModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() unit: IUnitEntity | null = null;
  @Output() closed = new EventEmitter<void>();

  private readonly scoreHistoryStore = inject(SCORE_HISTORY_STORE_PORT);
  private readonly usersStore = inject(USERS_STORE_PORT);
  private readonly pdfReport = inject(PDF_REPORT_PORT);
  private requestSequence = 0;

  protected readonly historyItems = signal<IScoreHistoryEntity[]>([]);
  protected readonly EPermission = EPermission;
  protected readonly statusLabels = SCORE_HISTORY_STATUS_LABELS;
  protected readonly statusBadgeClasses: Record<EScoreHistoryStatus, string> = {
    [EScoreHistoryStatus.PENDING]:
      'bg-amber-500/10 text-amber-300 border-amber-500/30',
    [EScoreHistoryStatus.APPROVED]:
      'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    [EScoreHistoryStatus.REJECTED]:
      'bg-red-500/10 text-red-300 border-red-500/30',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] || changes['unit']) {
      void this.loadHistory();
    }
  }

  onClosed(): void {
    this.requestSequence++;
    this.historyItems.set([]);
    this.closed.emit();
  }

  generatePdfReport(): void {
    const unit = this.unit;
    if (!unit) return;

    const genderLabels: Record<EUnitGender, string> = {
      [EUnitGender.MALE]: 'Desbravadores',
      [EUnitGender.FEMALE]: 'Desbravadoras',
      [EUnitGender.MIXED]: 'Mista',
    };

    const htmlContent = generateReportHtml({
      title: 'Relatório de Histórico de Pontuação',
      subtitle: `Unidade: ${unit.name} (${genderLabels[unit.gender]}) | Pontuação Geral Atual: ${unit.score}`,
      columns: [
        {
          header: 'Situação',
          render: (item) => this.statusLabels[item.status],
          className: 'font-semibold',
          classNameFor: (item) => {
            switch (item.status) {
              case EScoreHistoryStatus.PENDING:
                return 'text-amber-700';
              case EScoreHistoryStatus.APPROVED:
                return 'text-emerald-700';
              case EScoreHistoryStatus.REJECTED:
                return 'text-red-700';
            }
          },
        },
        {
          header: 'Pontuação',
          className: 'font-mono font-bold',
          classNameFor: (item) =>
            item.score > 0 ? 'text-emerald-600' : 'text-red-600',
          render: (item) =>
            item.score > 0 ? `+${item.score}` : String(item.score),
        },
        { header: 'Motivo', field: 'description', className: 'text-slate-800' },
        {
          header: 'Solicitado',
          render: (item) => item.requestedBy?.username || '-',
          className: 'text-slate-600',
        },
        {
          header: 'Revisado por',
          render: (item) => {
            switch (item.status) {
              case EScoreHistoryStatus.APPROVED:
                return item.approvedBy?.username || '-';
              case EScoreHistoryStatus.REJECTED:
                return item.rejectedBy?.username || '-';
              case EScoreHistoryStatus.PENDING:
                return '-';
            }
          },
          className: 'text-slate-600',
        },
        {
          header: 'Data e Hora',
          render: (item) =>
            new Date(item.createdAt).toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
          className: 'text-slate-500 whitespace-nowrap',
        },
      ],
      data: this.historyItems(),
    });

    this.pdfReport.openReportWindow(htmlContent);
  }

  trackById(_index: number, record: IScoreHistoryEntity): string {
    return record.id;
  }

  private async loadHistory(): Promise<void> {
    const unit = this.unit;
    const requestId = ++this.requestSequence;
    this.historyItems.set([]);

    if (
      !this.isOpen ||
      !unit ||
      !this.userHasPermission(EPermission.SCORE_HISTORY_READ)
    ) {
      return;
    }

    try {
      const history = await this.scoreHistoryStore.fetchUnitScoreHistory(
        unit.id,
      );
      if (
        requestId === this.requestSequence &&
        this.isOpen &&
        this.unit?.id === unit.id
      ) {
        this.historyItems.set(history);
      }
    } catch {
      if (requestId === this.requestSequence) this.historyItems.set([]);
    }
  }

  private userHasPermission(permission: EPermission): boolean {
    const user = this.usersStore.userCurrentEntity();
    return (
      user?.roles.some((role) => role.permissions.includes(permission)) ?? false
    );
  }
}
