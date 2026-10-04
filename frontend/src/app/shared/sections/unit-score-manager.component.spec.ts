import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { UnitScoreManagerComponent } from './unit-score-manager.component';

describe('UnitScoreManagerComponent', () => {
  let fixture: ComponentFixture<UnitScoreManagerComponent>;
  let component: UnitScoreManagerComponent;

  const scoreStoreMock = {
    error: signal<string | null>(null),
    isLoading: signal(false),
    registerUnitScore: vi.fn(),
  };

  const unitsStoreMock = {
    unitsList: signal([]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    fetchAllUnits: vi.fn(),
  };

  const validFormValue = {
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    score: '-15',
    description: 'Correção de pontuação',
  };

  beforeEach(async () => {
    scoreStoreMock.error.set(null);
    scoreStoreMock.isLoading.set(false);
    scoreStoreMock.registerUnitScore.mockReset();
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
    const openButton: HTMLButtonElement = (
      fixture.nativeElement as HTMLElement
    ).querySelector('header button');

    openButton.click();
    fixture.detectChanges();

    expect(component.isScoreModalOpen()).toBe(true);
  });

  it('should close the modal', () => {
    component.openScoreModal();

    component.closeScoreModal();

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
      score: '1.5',
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
    expect(unitsStoreMock.fetchAllUnits).toHaveBeenCalledOnce();
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
