import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { Units } from './units';

@Component({
  standalone: true,
  selector: 'app-header',
  template: '<header data-testid="header-stub"></header>',
})
class HeaderStubComponent {}

@Component({
  standalone: true,
  selector: 'app-unit-score-manager',
  template: '<section data-testid="score-manager-stub"></section>',
})
class UnitScoreManagerStubComponent {}

describe('Units', () => {
  let fixture: ComponentFixture<Units>;
  let component: Units;

  const scoreStoreMock = {
    registerScore: vi.fn(),
  };

  const validFormValue = {
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    score: '-15',
    description: 'Correção de pontuação',
  };

  beforeEach(async () => {
    scoreStoreMock.registerScore.mockReset();

    await TestBed.configureTestingModule({
      imports: [Units],
      providers: [
        FormBuilder,
        { provide: SCORE_HISTORY_STORE_PORT, useValue: scoreStoreMock },
      ],
    })
      .overrideComponent(Units, {
        set: {
          imports: [HeaderStubComponent, UnitScoreManagerStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Units);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component with an initially invalid form and a closed modal', () => {
    expect(component).toBeTruthy();
    expect(component.scoreForm.invalid).toBe(true);
    expect(component.isScoreModalOpen()).toBe(false);
  });

  it('should render the header and score manager', () => {
    expect(
      fixture.nativeElement.querySelector('[data-testid="header-stub"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="score-manager-stub"]'),
    ).toBeTruthy();
  });

  it('should reset the form and open the modal for the selected unit', () => {
    component.scoreForm.setValue({
      unitId: 'previous-unit',
      score: 25,
      description: 'Previous description',
    });
    component.scoreForm.markAllAsTouched();

    component.openScoreModal(validFormValue.unitId);

    expect(component.isScoreModalOpen()).toBe(true);
    expect(component.scoreForm.getRawValue()).toEqual({
      unitId: validFormValue.unitId,
      score: 0,
      description: '',
    });
    expect(component.scoreForm.untouched).toBe(true);
  });

  it('should close the modal', () => {
    component.openScoreModal(validFormValue.unitId);

    component.closeScoreModal();

    expect(component.isScoreModalOpen()).toBe(false);
  });

  it('should mark invalid controls as touched and skip submission', async () => {
    component.openScoreModal(validFormValue.unitId);

    await component.onSubmitScore();

    expect(component.scoreForm.invalid).toBe(true);
    expect(component.scoreForm.get('description')?.touched).toBe(true);
    expect(scoreStoreMock.registerScore).not.toHaveBeenCalled();
    expect(component.isScoreModalOpen()).toBe(true);
  });

  it('should reject a non-integer score without calling the store', async () => {
    component.openScoreModal(validFormValue.unitId);
    component.scoreForm.setValue({
      ...validFormValue,
      score: '1.5',
    });

    await component.onSubmitScore();

    expect(component.scoreForm.get('score')?.invalid).toBe(true);
    expect(scoreStoreMock.registerScore).not.toHaveBeenCalled();
  });

  it('should reject a description longer than 255 characters', async () => {
    component.openScoreModal(validFormValue.unitId);
    component.scoreForm.setValue({
      ...validFormValue,
      description: 'a'.repeat(256),
    });

    await component.onSubmitScore();

    expect(component.scoreForm.get('description')?.invalid).toBe(true);
    expect(scoreStoreMock.registerScore).not.toHaveBeenCalled();
  });

  it('should submit valid data with a numeric score and close the modal on success', async () => {
    scoreStoreMock.registerScore.mockResolvedValue(true);
    component.openScoreModal(validFormValue.unitId);
    component.scoreForm.setValue(validFormValue);

    await component.onSubmitScore();

    expect(scoreStoreMock.registerScore).toHaveBeenCalledOnce();
    expect(scoreStoreMock.registerScore).toHaveBeenCalledWith(
      validFormValue.unitId,
      {
        score: -15,
        description: validFormValue.description,
      },
    );
    expect(component.isScoreModalOpen()).toBe(false);
  });

  it('should keep the modal open when the store returns false', async () => {
    scoreStoreMock.registerScore.mockResolvedValue(false);
    component.openScoreModal(validFormValue.unitId);
    component.scoreForm.setValue(validFormValue);

    await component.onSubmitScore();

    expect(scoreStoreMock.registerScore).toHaveBeenCalledOnce();
    expect(component.isScoreModalOpen()).toBe(true);
  });

  it('should swallow store errors and keep the modal open', async () => {
    scoreStoreMock.registerScore.mockRejectedValue(
      new Error('Failed to register score'),
    );
    component.openScoreModal(validFormValue.unitId);
    component.scoreForm.setValue(validFormValue);

    await expect(component.onSubmitScore()).resolves.toBeUndefined();

    expect(scoreStoreMock.registerScore).toHaveBeenCalledOnce();
    expect(component.isScoreModalOpen()).toBe(true);
  });
});
