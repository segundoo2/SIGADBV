import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IUnitEntity } from '../../core/domain/entities/unit.entity';
import { EUnitGender } from '../../core/domain/enums/unit-gender.enum';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { PDF_REPORT_PORT } from '../../core/infra/tokens/pdf-report.token';
import { IScoreHistoryEntity } from '../../core/domain/entities/score-history.entity';
import { UnitsPage } from './units';

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

@Component({
  standalone: true,
  selector: 'app-error-message',
  template: '<div data-testid="error-message-stub">{{ message }}</div>',
})
class ErrorMessageStubComponent {
  @Input() message: string | null = null;
}

@Component({
  standalone: true,
  selector: 'app-modal',
  template:
    '<div data-testid="modal-stub"><ng-content></ng-content><ng-content select="[modal-footer]"></ng-content></div>',
})
class ModalStubComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() size = '';
}

@Component({
  standalone: true,
  selector: 'app-access-denied-card',
  template: '<div><ng-content></ng-content></div>',
})
class AccessDeniedCardStubComponent {
  @Input() requiredPermission: unknown;
  @Input() message = '';
}

describe('UnitsPage', () => {
  let fixture: ComponentFixture<UnitsPage>;
  let component: UnitsPage;
  let unitsStoreMock: {
    unitsList: ReturnType<typeof signal<IUnitEntity[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    fetchAllUnits: ReturnType<typeof vi.fn>;
  };
  let scoreHistoryStoreMock: {
    fetchUnitScoreHistory: ReturnType<typeof vi.fn>;
  };
  let pdfReportMock: {
    openReportWindow: ReturnType<typeof vi.fn>;
  };

  const mockUnit: IUnitEntity = {
    id: 'unit-1',
    tenantId: 'tenant-1',
    name: 'Alpha',
    gender: EUnitGender.MALE,
    maxMembers: 8,
    score: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    unitsStoreMock = {
      unitsList: signal<IUnitEntity[]>([mockUnit]),
      isLoading: signal(false),
      error: signal<string | null>(null),
      fetchAllUnits: vi.fn().mockResolvedValue([mockUnit]),
    };

    scoreHistoryStoreMock = {
      fetchUnitScoreHistory: vi.fn().mockResolvedValue([
        {
          id: 'hist-1',
          tenantId: 'tenant-1',
          unitId: 'unit-1',
          score: 5,
          description: 'Bom comportamento',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    };

    pdfReportMock = {
      openReportWindow: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UnitsPage],
      providers: [
        { provide: UNITS_STORE_PORT, useValue: unitsStoreMock },
        { provide: SCORE_HISTORY_STORE_PORT, useValue: scoreHistoryStoreMock },
        { provide: PDF_REPORT_PORT, useValue: pdfReportMock },
      ],
    })
      .overrideComponent(UnitsPage, {
        set: {
          imports: [
            HeaderStubComponent,
            UnitScoreManagerStubComponent,
            ErrorMessageStubComponent,
            ModalStubComponent,
            AccessDeniedCardStubComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UnitsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the page and load units on initialization', () => {
    expect(component).toBeTruthy();
    expect(unitsStoreMock.fetchAllUnits).toHaveBeenCalledOnce();
  });

  it('should render the header and score manager', () => {
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="header-stub"]',
      ),
    ).toBeTruthy();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="score-manager-stub"]',
      ),
    ).toBeTruthy();
  });

  it('should render unit genders with Portuguese labels', () => {
    const genders = [EUnitGender.MALE, EUnitGender.FEMALE, EUnitGender.MIXED];
    unitsStoreMock.unitsList.set(
      genders.map((gender, position): IUnitEntity => ({
        id: `unit-${position}`,
        tenantId: 'tenant-1',
        name: `Unidade ${position}`,
        gender,
        maxMembers: 8,
        score: 0,
        createdAt: new Date('2026-09-01T10:00:00.000Z'),
        updatedAt: new Date('2026-09-02T10:00:00.000Z'),
      })),
    );
    fixture.detectChanges();

    const renderedGenders = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '.rounded-full',
      ),
      (element) => element.textContent?.trim() ?? '',
    );

    expect(renderedGenders).toEqual([
      'Desbravadores',
      'Desbravadoras',
      'Mista',
    ]);
  });

  it('should open history modal and fetch history successfully', async () => {
    await component.openHistoryModal(mockUnit);

    expect(component.selectedUnit()).toEqual(mockUnit);
    expect(component.isHistoryModalOpen()).toBe(true);
    expect(scoreHistoryStoreMock.fetchUnitScoreHistory).toHaveBeenCalledWith(
      'unit-1',
    );
    expect(component.unitHistoryItems().length).toBe(1);
  });

  it('should handle error gracefully when fetching history fails in openHistoryModal', async () => {
    scoreHistoryStoreMock.fetchUnitScoreHistory.mockRejectedValueOnce(
      new Error('Network error'),
    );

    await component.openHistoryModal(mockUnit);

    expect(component.selectedUnit()).toEqual(mockUnit);
    expect(component.isHistoryModalOpen()).toBe(true);
    expect(component.unitHistoryItems()).toEqual([]);
  });

  it('should close history modal and reset state', () => {
    component.selectedUnit.set(mockUnit);
    component.isHistoryModalOpen.set(true);
    component.unitHistoryItems.set([
      { id: '1' } as unknown as IScoreHistoryEntity,
    ]);

    component.closeHistoryModal();

    expect(component.isHistoryModalOpen()).toBe(false);
    expect(component.selectedUnit()).toBeNull();
    expect(component.unitHistoryItems()).toEqual([]);
  });

  it('should not call openReportWindow if no unit is selected', () => {
    component.selectedUnit.set(null);
    component.generatePdfReport();
    expect(pdfReportMock.openReportWindow).not.toHaveBeenCalled();
  });

  it('should call openReportWindow with generated HTML when unit is selected', () => {
    component.selectedUnit.set(mockUnit);
    component.unitHistoryItems.set([
      {
        id: 'hist-1',
        tenantId: 'tenant-1',
        unitId: 'unit-1',
        score: 5,
        description: 'Bom comportamento',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    component.generatePdfReport();

    expect(pdfReportMock.openReportWindow).toHaveBeenCalledOnce();
    const htmlPassed = (
      pdfReportMock.openReportWindow.mock.calls[0] as [string]
    )[0];
    expect(htmlPassed).toContain('Alpha');
    expect(htmlPassed).toContain('Relatório de Histórico de Pontuação');
    expect(htmlPassed).toContain('Bom comportamento');
  });

  it('should return correct trackById value for a record', () => {
    const record: IScoreHistoryEntity = {
      id: 'record-99',
      tenantId: 'tenant-1',
      unitId: 'unit-1',
      score: 10,
      description: 'Test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(component.trackById(0, record)).toBe('record-99');
  });
});
