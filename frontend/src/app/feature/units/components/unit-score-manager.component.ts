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
import { SCORE_HISTORY_STORE_PORT } from '../../../core/infra/tokens/score-history.token';
import { USERS_STORE_PORT } from '../../../core/infra/tokens/users.token';
import { UNITS_STORE_PORT } from '../../../core/infra/tokens/units.token';
import { EPermission } from '../../../core/domain/enums/permissions.enum';
import { AccessDeniedCard } from '../../../shared/cards/access-denied-card.component';
import { ButtonComponent } from '../../../shared/buttons/button.component';
import { ErrorMessageComponent } from '../../../shared/error-message/error-message.component';
import { InputFormComponent } from '../../../shared/inputs/input-form';
import { ModalComponent } from '../../../shared/modals/modal.component';
import {
  SelectFormComponent,
  SelectOption,
} from '../../../shared/selects/select-form.component';

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
    AccessDeniedCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './unit-score-manager.component.html',
})
export class UnitScoreManagerComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  protected readonly scoreHistory = inject(SCORE_HISTORY_STORE_PORT);
  private readonly usersStore = inject(USERS_STORE_PORT);
  private readonly unitsStore = inject(UNITS_STORE_PORT);

  protected readonly EPermission = EPermission;

  readonly canRequestScore = computed(() =>
    this.userHasPermission(EPermission.SCORE_HISTORY_ADJUST),
  );

  readonly canListTargetUnits = computed(
    () =>
      this.userHasPermission(EPermission.UNIT_READ) ||
      this.userHasPermission(EPermission.SCORE_HISTORY_APPROVE),
  );

  readonly isScoreModalOpen = signal<boolean>(false);

  // Opções computadas reativamente a partir da store
  readonly unitOptions = computed<SelectOption[]>(() =>
    (this.userHasPermission(EPermission.UNIT_READ)
      ? this.unitsStore.unitsList()
      : this.scoreHistory.unitsOptions()
    ).map((unit) => ({
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
    if (!this.userHasPermission(EPermission.UNIT_READ)) {
      this.loadUnitOptions();
    }
  }

  openScoreModal(): void {
    if (!this.canRequestScore()) return;

    this.loadUnitOptions(true);
    this.scoreHistory.clearError();
    this.scoreForm.reset({ unitId: '', score: 0, description: '' });
    this.isScoreModalOpen.set(true);
  }

  closeScoreModal(): void {
    this.isScoreModalOpen.set(false);
  }

  async onSubmitScore(): Promise<void> {
    if (!this.canRequestScore()) return;

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

  private loadUnitOptions(refreshUnits = false): void {
    if (!this.canRequestScore()) return;

    if (this.userHasPermission(EPermission.UNIT_READ)) {
      if (refreshUnits && this.unitsStore.unitsList().length === 0) {
        void this.unitsStore.fetchAllUnits();
      }
      return;
    }

    if (this.userHasPermission(EPermission.SCORE_HISTORY_APPROVE)) {
      void this.scoreHistory.fetchAllUnitsOptions();
    }
  }

  private userHasPermission(permission: EPermission): boolean {
    const user = this.usersStore.userCurrentEntity();
    return (
      user?.roles.some((role) => role.permissions.includes(permission)) ?? false
    );
  }
}
