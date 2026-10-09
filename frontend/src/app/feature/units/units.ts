import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EUnitGender } from '../../core/domain/enums/unit-gender.enum';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { HeaderComponent } from '../../shared/headers/header';
import { ErrorMessageComponent } from '../../shared/error-message/error-message.component';
import { UnitScoreManagerComponent } from '../../shared/sections/unit-score-manager.component';
import { ModalComponent } from '../../shared/modals/modal.component';
import { Title } from '@angular/platform-browser';
import { AccessDeniedCard } from '../../shared/cards/access-denied-card.component';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { IScoreHistoryEntity } from '../../core/domain/entities/score-history.entity';
import { IUnitEntity } from '../../core/domain/entities/unit.entity';
import { PDF_REPORT_PORT } from '../../core/infra/tokens/pdf-report.token';
import { generateReportHtml } from '../../shared/templates/unit-report.template';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ErrorMessageComponent,
    UnitScoreManagerComponent,
    ModalComponent,
    AccessDeniedCard,
  ],
  selector: 'app-units',
  templateUrl: './units.html',
})
export class UnitsPage implements OnInit {
  private readonly titleService = inject(Title);
  protected readonly unitsStore = inject(UNITS_STORE_PORT);
  private readonly scoreHistoryStore = inject(SCORE_HISTORY_STORE_PORT);
  private readonly pdfReport = inject(PDF_REPORT_PORT);

  protected readonly EPermission = EPermission;

  readonly isHistoryModalOpen = signal<boolean>(false);
  readonly selectedUnit = signal<IUnitEntity | null>(null);
  readonly unitHistoryItems = signal<IScoreHistoryEntity[]>([]);

  protected readonly genderLabels: Record<EUnitGender, string> = {
    [EUnitGender.MALE]: 'Desbravadores',
    [EUnitGender.FEMALE]: 'Desbravadoras',
    [EUnitGender.MIXED]: 'Mista',
  };

  ngOnInit(): void {
    this.titleService.setTitle('SIGADBV - Unidades');
    void this.unitsStore.fetchAllUnits();
  }

  async openHistoryModal(unit: IUnitEntity): Promise<void> {
    this.selectedUnit.set(unit);
    this.isHistoryModalOpen.set(true);
    this.unitHistoryItems.set([]);

    try {
      const history = await this.scoreHistoryStore.fetchUnitScoreHistory(
        unit.id,
      );
      this.unitHistoryItems.set(history);
    } catch {
      this.unitHistoryItems.set([]);
    }
  }

  closeHistoryModal(): void {
    this.isHistoryModalOpen.set(false);
    this.selectedUnit.set(null);
    this.unitHistoryItems.set([]);
  }

  generatePdfReport(): void {
    const unit = this.selectedUnit();
    if (!unit) return;

    const genderLabel = this.genderLabels[unit.gender];
    const history = this.unitHistoryItems();

    const htmlContent = generateReportHtml({
      title: 'Relatório de Histórico de Pontuação',
      subtitle: `Unidade: <strong>${unit.name}</strong> (${genderLabel}) | Pontuação Geral Atual: <strong>${unit.score}</strong>`,
      columns: [
        {
          header: 'Pontuação',
          className: 'font-mono font-bold',
          render: (item) => {
            const isPositive = item.score > 0;
            const colorClass = isPositive ? 'text-emerald-600' : 'text-red-600';
            return `<span class="${colorClass}">${isPositive ? '+' + item.score : item.score}</span>`;
          },
        },
        { header: 'Motivo', field: 'description', className: 'text-slate-800' },
        {
          header: 'Solicitado',
          render: (item) => item.requestedBy?.username || '-',
          className: 'text-slate-600',
        },
        {
          header: 'Aprovado',
          render: (item) => item.approvedBy?.username || '-',
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
      data: history,
    });

    this.pdfReport.openReportWindow(htmlContent);
  }

  trackById(_index: number, record: IScoreHistoryEntity): string {
    return record.id;
  }
}
