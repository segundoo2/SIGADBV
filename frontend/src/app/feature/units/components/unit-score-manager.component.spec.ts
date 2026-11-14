import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCORE_HISTORY_STORE_PORT } from '../../../core/infra/tokens/score-history.token';
import { UNITS_STORE_PORT } from '../../../core/infra/tokens/units.token';
import { USERS_STORE_PORT } from '../../../core/infra/tokens/users.token';
import { EPermission } from '../../../core/domain/enums/permissions.enum';
import { UserEntity } from '../../../core/domain/entities/user.entity';
import { UnitScoreManagerComponent } from './unit-score-manager.component';
import { SelectOption } from '../../../shared/selects/select-form.component';

describe('UnitScoreManagerComponent', () => {
  let fixture: ComponentFixture<UnitScoreManagerComponent>;
  let component: UnitScoreManagerComponent;

  const scoreStoreMock = {
    error: signal<string | null>(null),
    isLoading: signal(false),
    unitsOptions: signal<SelectOption[]>([]), // Tipagem explícita para aceitar as opções de unidade
    registerUnitScore: vi.fn(),
    fetchAllUnitsOptions: vi.fn().mockResolvedValue([]),
    clearError: vi.fn(),
  };

  const unitsStoreMock = {
    unitsList: signal([
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: 'tenant-1',
        name: 'Unidade Alpha',
        gender: 'MIXED',
        maxMembers: 8,
        score: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    fetchAllUnits: vi.fn(),
  };

  const usersStoreMock = {
    userCurrentEntity: signal<UserEntity | null>({
      id: 'user-1',
      tenantId: 'tenant-1',
      username: 'test.user',
      mustChangePassword: false,
      roles: [
        {
          id: 'role-1',
          tenantId: 'tenant-1',
          name: 'Pontuador',
          permissions: [
            EPermission.SCORE_HISTORY_ADJUST,
            EPermission.UNIT_READ,
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  };

  const validFormValue = {
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    score: -15,
    description: 'Correção de pontuação',
  };

  beforeEach(async () => {
    usersStoreMock.userCurrentEntity.set({
      ...usersStoreMock.userCurrentEntity()!,
      roles: [
        {
          id: 'role-1',
          tenantId: 'tenant-1',
          name: 'Pontuador',
          permissions: [
            EPermission.SCORE_HISTORY_ADJUST,
            EPermission.UNIT_READ,
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    scoreStoreMock.error.set(null);
    scoreStoreMock.isLoading.set(false);
    scoreStoreMock.unitsOptions.set([]);
    scoreStoreMock.registerUnitScore.mockReset();
    scoreStoreMock.fetchAllUnitsOptions.mockClear();
    unitsStoreMock.unitsList.set([
      {
        id: validFormValue.unitId,
        tenantId: 'tenant-1',
        name: 'Unidade Alpha',
        gender: 'MIXED',
        maxMembers: 8,
        score: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    unitsStoreMock.fetchAllUnits.mockReset().mockResolvedValue([
      {
        id: validFormValue.unitId,
        tenantId: 'tenant-1',
        name: 'Unidade Alpha',
        gender: 'MIXED',
        maxMembers: 8,
        score: 120,
        createdAt: new Date('2026-09-01T10:00:00.000Z'),
        updatedAt: new Date('2026-09-02T10:00:00.000Z'),
      },
    ]);

    await TestBed.configureTestingModule({
      imports: [UnitScoreManagerComponent],
      providers: [
        { provide: USERS_STORE_PORT, useValue: usersStoreMock },
        {
          provide: SCORE_HISTORY_STORE_PORT,
          useValue: scoreStoreMock,
        },
        { provide: UNITS_STORE_PORT, useValue: unitsStoreMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnitScoreManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the component with an invalid initial form', () => {
    expect(component).toBeTruthy();
    expect(component.scoreForm.invalid).toBe(true);
    expect(component.isScoreModalOpen()).toBe(false);
  });

  it('should open the modal and reset the form', () => {
    component.scoreForm.setValue({
      unitId: validFormValue.unitId,
      score: 50,
      description: 'Valor anterior',
    });
    component.scoreForm.markAllAsTouched();

    component.openScoreModal();

    expect(component.isScoreModalOpen()).toBe(true);
    expect(component.scoreForm.getRawValue()).toEqual({
      unitId: '',
      score: 0,
      description: '',
    });
    expect(component.scoreForm.untouched).toBe(true);
  });

  it('should open the modal when the open button is clicked', () => {
    const openButton = (fixture.nativeElement as HTMLElement).querySelector(
      'header button',
    );
    expect(openButton).not.toBeNull();

    openButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.isScoreModalOpen()).toBe(true);
  });

  it('should not show request capability without score-history.adjust', () => {
    usersStoreMock.userCurrentEntity.set({
      ...usersStoreMock.userCurrentEntity()!,
      roles: [
        {
          id: 'role-reader',
          tenantId: 'tenant-1',
          name: 'Leitor',
          permissions: [EPermission.UNIT_READ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    component.openScoreModal();

    expect(component.canRequestScore()).toBe(false);
    expect(component.isScoreModalOpen()).toBe(false);
    expect(scoreStoreMock.registerUnitScore).not.toHaveBeenCalled();
  });

  it('should use the dedicated unit-options endpoint for adjust and approve permissions without unit.read', () => {
    usersStoreMock.userCurrentEntity.set({
      ...usersStoreMock.userCurrentEntity()!,
      roles: [
        {
          id: 'role-approver',
          tenantId: 'tenant-1',
          name: 'Aprovador e solicitante',
          permissions: [
            EPermission.SCORE_HISTORY_ADJUST,
            EPermission.SCORE_HISTORY_APPROVE,
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    unitsStoreMock.unitsList.set([]);
    scoreStoreMock.unitsOptions.set([
      { id: validFormValue.unitId, name: 'Unidade Alpha' },
    ]);

    component.openScoreModal();

    expect(scoreStoreMock.fetchAllUnitsOptions).toHaveBeenCalledOnce();
    expect(component.unitOptions()).toEqual([
      { id: validFormValue.unitId, name: 'Unidade Alpha' },
    ]);
    expect(component.isScoreModalOpen()).toBe(true);
  });

  it('should not open the request modal when the user has no score-history.adjust permission', () => {
    usersStoreMock.userCurrentEntity.set({
      ...usersStoreMock.userCurrentEntity()!,
      roles: [
        {
          id: 'role-reader',
          tenantId: 'tenant-1',
          name: 'Leitor',
          permissions: [EPermission.UNIT_READ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    component.openScoreModal();

    expect(component.isScoreModalOpen()).toBe(false);
    expect(scoreStoreMock.fetchAllUnitsOptions).not.toHaveBeenCalled();
  });

  it('allows an adjust-only user to submit a manually selected unit UUID', async () => {
    usersStoreMock.userCurrentEntity.set({
      ...usersStoreMock.userCurrentEntity()!,
      roles: [
        {
          id: 'role-adjust-only',
          tenantId: 'tenant-1',
          name: 'Solicitante',
          permissions: [EPermission.SCORE_HISTORY_ADJUST],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
    unitsStoreMock.unitsList.set([]);
    scoreStoreMock.unitsOptions.set([]);

    component.openScoreModal();
    fixture.detectChanges();

    expect(component.isScoreModalOpen()).toBe(true);
    expect(component.canListTargetUnits()).toBe(false);
    expect(scoreStoreMock.fetchAllUnitsOptions).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="unit-id-input"]',
      ),
    ).not.toBeNull();

    scoreStoreMock.registerUnitScore.mockResolvedValue(undefined);
    component.scoreForm.setValue(validFormValue);
    await component.onSubmitScore();

    expect(scoreStoreMock.registerUnitScore).toHaveBeenCalledWith(
      validFormValue.unitId,
      { score: -15, description: validFormValue.description },
    );
  });

  it('should close the modal', () => {
    component.openScoreModal();
    component.closeScoreModal();

    expect(component.isScoreModalOpen()).toBe(false);
  });

  it('should close the modal when the close button is clicked', () => {
    component.openScoreModal();
    fixture.detectChanges();

    const closeButton = (fixture.nativeElement as HTMLElement).querySelector(
      'article button[aria-label="Fechar modal"]',
    );
    expect(closeButton).not.toBeNull();
    closeButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.isScoreModalOpen()).toBe(false);
  });

  it('should mark all form controls as touched and not submit an invalid form', async () => {
    component.openScoreModal();

    await component.onSubmitScore();

    expect(component.scoreForm.invalid).toBe(true);
    expect(component.scoreForm.get('unitId')?.touched).toBe(true);
    expect(component.scoreForm.get('description')?.touched).toBe(true);
    expect(scoreStoreMock.registerUnitScore).not.toHaveBeenCalled();
    expect(component.isScoreModalOpen()).toBe(true);
  });

  it('should reject a non-integer score without calling the store', async () => {
    component.openScoreModal();
    component.scoreForm.setValue({
      ...validFormValue,
      score: NaN,
    });

    await component.onSubmitScore();

    expect(component.scoreForm.get('score')?.invalid).toBe(true);
    expect(component.scoreForm.get('score')?.touched).toBe(true);
    expect(scoreStoreMock.registerUnitScore).not.toHaveBeenCalled();
  });

  it('should reject a description longer than 255 characters', async () => {
    component.openScoreModal();
    component.scoreForm.setValue({
      ...validFormValue,
      description: 'a'.repeat(256),
    });

    await component.onSubmitScore();

    expect(component.scoreForm.get('description')?.invalid).toBe(true);
    expect(scoreStoreMock.registerUnitScore).not.toHaveBeenCalled();
  });

  it('should submit a valid form and close the modal when the store succeeds', async () => {
    scoreStoreMock.registerUnitScore.mockResolvedValue(undefined);
    component.openScoreModal();
    unitsStoreMock.fetchAllUnits.mockClear();
    component.scoreForm.setValue(validFormValue);

    await component.onSubmitScore();

    expect(scoreStoreMock.registerUnitScore).toHaveBeenCalledOnce();
    expect(scoreStoreMock.registerUnitScore).toHaveBeenCalledWith(
      validFormValue.unitId,
      {
        score: -15,
        description: validFormValue.description,
      },
    );
    expect(component.isScoreModalOpen()).toBe(false);
  });

  it('should handle a store error and keep the modal open', async () => {
    scoreStoreMock.registerUnitScore.mockRejectedValue(
      new Error('Failed to register score'),
    );
    component.openScoreModal();
    component.scoreForm.setValue(validFormValue);

    await expect(component.onSubmitScore()).resolves.toBeUndefined();

    expect(scoreStoreMock.registerUnitScore).toHaveBeenCalledOnce();
    expect(component.isScoreModalOpen()).toBe(true);
  });
});
