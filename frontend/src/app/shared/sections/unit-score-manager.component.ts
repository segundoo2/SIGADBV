import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
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
  templateUrl: './unit-score-manager.component.html',
})
export class UnitScoreManagerComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly scoreHistory = inject(SCORE_HISTORY_STORE_PORT);

  readonly isScoreModalOpen = signal<boolean>(false);

  // Opções computadas reativamente a partir da store
  readonly unitOptions = computed<SelectOption[]>(() =>
    this.scoreHistory.unitsOptions().map((unit) => ({
      id: unit.id,
      name: unit.name,
    })),
  );

  readonly scoreForm = this.formBuilder.nonNullable.group({
    unitId: ['', [Validators.required.bind(Validators)]],
    score: [
      0,
      [Validators.required.bind(Validators), Validators.pattern(/^-?\d+$/)],
    ],
    description: [
      '',
      [Validators.required.bind(Validators), Validators.maxLength(255)],
    ],
  });

  ngOnInit(): void {
    void this.scoreHistory.fetchAllUnitsOptions();
  }

  openScoreModal(): void {
    void this.scoreHistory.fetchAllUnitsOptions();
    this.scoreHistory.clearError();
    this.scoreForm.reset({ unitId: '', score: 0, description: '' });
    this.isScoreModalOpen.set(true);
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
      await this.scoreHistory.registerUnitScore(unitId, {
        score: Number(score),
        description,
      });

      this.isScoreModalOpen.set(false);
    } catch {
      // Tratado pelo store
    }
  }
}
