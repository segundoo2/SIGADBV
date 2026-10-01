import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IUnitEntity } from '../../core/domain/entities/unit.entity';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
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

@Component({
  standalone: true,
  selector: 'app-error-message',
  template: '<div data-testid="error-message-stub">{{ message }}</div>',
})
class ErrorMessageStubComponent {
  @Input() message: string | null = null;
}

describe('Units', () => {
  let fixture: ComponentFixture<Units>;
  let component: Units;
  let unitsStoreMock: {
    unitsList: ReturnType<typeof signal<IUnitEntity[]>>;
    successMessage: ReturnType<typeof signal<string>>;
    isLoading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<string | null>>;
    getAllUnits: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    unitsStoreMock = {
      unitsList: signal<IUnitEntity[]>([]),
      successMessage: signal(''),
      isLoading: signal(false),
      error: signal<string | null>(null),
      getAllUnits: vi.fn().mockResolvedValue({ message: 'Loaded', data: [] }),
    };

    await TestBed.configureTestingModule({
      imports: [Units],
      providers: [{ provide: UNITS_STORE_PORT, useValue: unitsStoreMock }],
    })
      .overrideComponent(Units, {
        set: {
          imports: [
            HeaderStubComponent,
            UnitScoreManagerStubComponent,
            ErrorMessageStubComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(Units);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create the page and load units on initialization', () => {
    expect(component).toBeTruthy();
    expect(unitsStoreMock.getAllUnits).toHaveBeenCalledOnce();
  });

  it('should render the header and score manager', () => {
    expect(
      fixture.nativeElement.querySelector('[data-testid="header-stub"]'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('[data-testid="score-manager-stub"]'),
    ).toBeTruthy();
  });

  it('should keep the page usable when loading units fails', async () => {
    unitsStoreMock.getAllUnits.mockRejectedValueOnce(
      new Error('Failed to load units'),
    );

    await expect(component.ngOnInit()).resolves.toBeUndefined();

    expect(unitsStoreMock.getAllUnits).toHaveBeenCalledTimes(2);
    expect(
      fixture.nativeElement.querySelector('[data-testid="header-stub"]'),
    ).toBeTruthy();
  });
});
