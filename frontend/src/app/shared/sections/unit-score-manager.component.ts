import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { ButtonComponent } from '../buttons/button.component';
import { ErrorMessageComponent } from '../error-message/error-message.component';
import { InputFormComponent } from '../inputs/input-form';
import { ModalComponent } from '../modals/modal.component';
import {
  SelectFormComponent,
  SelectOption,
} from '../selects/select-form.component';

@Component({
  selector: 'app-unit-score-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ModalComponent,
    InputFormComponent,
    SelectFormComponent,
    ButtonComponent,
    ErrorMessageComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="p-6 max-w-7xl mx-auto space-y-6">
      <header
        class="flex justify-between items-center bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm"
      >
        <div>
          <h1 class="text-2xl font-bold text-white">Pontuação de Unidades</h1>
          <p class="text-sm text-slate-400">
            Mantenha o ranking das unidades atualizado solicitando novos ajustes
            de pontos.
          </p>
        </div>
        <button
          type="button"
          (click)="openScoreModal()"
          class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          Solicitar Pontuação
        </button>
      </header>

      <app-modal
        [isOpen]="isScoreModalOpen()"
        title="Adicionar/Retirar Pontos"
        size="md"
        (closed)="closeScoreModal()"
      >
        <form
          [formGroup]="scoreForm"
          (ngSubmit)="onSubmitScore()"
          class="space-y-4"
          novalidate
        >
          <app-error-message
            [message]="scoreStore.error() || unitsStore.error()"
          />

          <fieldset class="flex flex-col gap-4 border-0 p-0 m-0">
            <!-- Seleção da Unidade -->
            <app-select-form
              id="unitId"
              [options]="unitOptions()"
              formControlName="unitId"
              testId="unit-select"
              errorTestId="unit-error"
              [showError]="
                !!(
                  scoreForm.get('unitId')?.touched &&
                  scoreForm.get('unitId')?.invalid
                )
              "
              errorMessage="Selecione uma unidade..."
            />
            <!-- Valor do Ajuste -->
            <app-input-form
              id="score"
              label="Valor do Ajuste (ex: 50 ou -15)"
              type="text"
              formControlName="score"
              testId="score-input"
              errorTestId="score-error"
              [showError]="
                !!(
                  scoreForm.get('score')?.touched &&
                  scoreForm.get('score')?.invalid
                )
              "
              errorMessage="Informe um valor inteiro válido para o ajuste."
            />
            <!-- Descrição -->
            <app-input-form
              id="description"
              label="Motivo / Descrição"
              type="text"
              formControlName="description"
              testId="description-input"
              errorTestId="description-error"
              [showError]="
                !!(
                  scoreForm.get('description')?.touched &&
                  scoreForm.get('description')?.invalid
                )
              "
              errorMessage="A descrição é obrigatória (máximo de 255 caracteres)."
            />
            <app-button
              type="submit"
              [isLoading]="scoreStore.isLoading()"
              loadingText="Solicitando pontuação..."
              testId="submit-score-btn"
            >
              Solicitar pontuação
            </app-button>
          </fieldset>
        </form>
      </app-modal>
    </section>
  `,
})
export class UnitScoreManagerComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly scoreStore = inject(SCORE_HISTORY_STORE_PORT);
  protected readonly unitsStore = inject(UNITS_STORE_PORT);

  readonly isScoreModalOpen = signal<boolean>(false);

  readonly unitOptions = signal<SelectOption[]>([]);

  readonly scoreForm = this.formBuilder.nonNullable.group({
    unitId: ['', [Validators.required.bind(Validators)]],
    score: [
      0 as number | string,
      [Validators.required.bind(Validators), Validators.pattern(/^-?\d+$/)],
    ],
    description: [
      '',
      [Validators.required.bind(Validators), Validators.maxLength(255)],
    ],
  });

  ngOnInit(): void {
    void this.loadUnits();
  }

  private async loadUnits(): Promise<void> {
    try {
      const units = await this.unitsStore.fetchAllUnits();
      const options: SelectOption[] = units.map((unit) => ({
        id: unit.id,
        name: unit.name,
      }));
      this.unitOptions.set(options);
    } catch {
      // Erro capturado e gerido pela unitsStore
    }
  }

  openScoreModal(): void {
    this.scoreForm.reset({ unitId: '', score: 0, description: '' });
    this.isScoreModalOpen.set(true);
    void this.loadUnits();
  }

  closeScoreModal(): void {
    this.isScoreModalOpen.set(false);
  }

  async onSubmitScore(): Promise<void> {
    if (this.scoreForm.invalid) {
      this.scoreForm.markAllAsTouched();
      return;
    }

    const { unitId, score, description } = this.scoreForm.getRawValue();

    try {
      await this.scoreStore.registerUnitScore(unitId, {
        score: Number(score),
        description,
      });

      await this.loadUnits();
      this.isScoreModalOpen.set(false);
    } catch {
      // Tratado pelo store
    }
  }
}
