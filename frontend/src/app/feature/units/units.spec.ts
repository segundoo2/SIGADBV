import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IUnitEntity } from '../../core/domain/entities/unit.entity';
import { EUnitGender } from '../../core/domain/enums/unit-gender.enum';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
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

describe('UnitsPage', () => {
  let fixture: ComponentFixture<UnitsPage>;
  let component: UnitsPage;
  let unitsStoreMock: {
    unitsList: ReturnType<typeof signal<IUnitEntity[]>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    fetchAllUnits: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    unitsStoreMock = {
      unitsList: signal<IUnitEntity[]>([]),
      isLoading: signal(false),
      error: signal<string | null>(null),
      fetchAllUnits: vi.fn().mockResolvedValue([]),
    };

    await TestBed.configureTestingModule({
      imports: [UnitsPage],
      providers: [{ provide: UNITS_STORE_PORT, useValue: unitsStoreMock }],
    })
      .overrideComponent(UnitsPage, {
        set: {
          imports: [
            HeaderStubComponent,
            UnitScoreManagerStubComponent,
            ErrorMessageStubComponent,
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
      (fixture.nativeElement as HTMLElement).querySelectorAll('.rounded-full'),
      (element: HTMLElement) => element.textContent.trim(),
    );

    expect(renderedGenders).toEqual([
      'Desbravadores',
      'Desbravadoras',
      'Mista',
    ]);
  });

  it('should keep the page usable when loading units fails', async () => {
    unitsStoreMock.fetchAllUnits.mockRejectedValueOnce(
      new Error('Failed to load units'),
    );

    component.ngOnInit();
    await vi.waitFor(() =>
      expect(unitsStoreMock.fetchAllUnits).toHaveBeenCalledTimes(2),
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="header-stub"]',
      ),
    ).toBeTruthy();
  });
});
