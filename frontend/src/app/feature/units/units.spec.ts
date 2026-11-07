import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IUnitEntity } from '../../core/domain/entities/unit.entity';
import { UserEntity } from '../../core/domain/entities/user.entity';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { EUnitGender } from '../../core/domain/enums/unit-gender.enum';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { UnitsPage } from './units';

@Component({ standalone: true, selector: 'app-header', template: '' })
class HeaderStubComponent {}

@Component({
  standalone: true,
  selector: 'app-unit-score-manager',
  template: '',
})
class UnitScoreManagerStubComponent {}

@Component({ standalone: true, selector: 'app-error-message', template: '' })
class ErrorMessageStubComponent {
  @Input() message: string | null = null;
}

@Component({
  standalone: true,
  selector: 'app-access-denied-card',
  template: '<ng-content />',
})
class AccessDeniedCardStubComponent {
  @Input() requiredPermission: unknown;
  @Input() message = '';
}

@Component({
  standalone: true,
  selector: 'app-unit-score-history-modal',
  template: '',
})
class UnitScoreHistoryModalStubComponent {
  @Input() isOpen = false;
  @Input() unit: IUnitEntity | null = null;
  @Output() closed = new EventEmitter<void>();
}

describe('UnitsPage', () => {
  let fixture: ComponentFixture<UnitsPage>;
  let component: UnitsPage;
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
  const userCurrentEntity = signal<UserEntity | null>({
    id: 'user-1',
    tenantId: 'tenant-1',
    username: 'test.user',
    mustChangePassword: false,
    roles: [
      {
        id: 'role-1',
        tenantId: 'tenant-1',
        name: 'Pontuador',
        permissions: [EPermission.UNIT_READ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const unitsStoreMock = {
    unitsList: signal<IUnitEntity[]>([mockUnit]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    fetchAllUnits: vi.fn().mockResolvedValue([mockUnit]),
  };

  beforeEach(async () => {
    unitsStoreMock.unitsList.set([mockUnit]);
    unitsStoreMock.isLoading.set(false);
    unitsStoreMock.fetchAllUnits.mockClear();
    userCurrentEntity.set({
      ...userCurrentEntity()!,
      roles: [
        {
          id: 'role-1',
          tenantId: 'tenant-1',
          name: 'Unidades',
          permissions: [EPermission.UNIT_READ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    await TestBed.configureTestingModule({
      imports: [UnitsPage],
      providers: [
        { provide: USERS_STORE_PORT, useValue: { userCurrentEntity } },
        { provide: UNITS_STORE_PORT, useValue: unitsStoreMock },
      ],
    })
      .overrideComponent(UnitsPage, {
        set: {
          imports: [
            HeaderStubComponent,
            UnitScoreManagerStubComponent,
            ErrorMessageStubComponent,
            AccessDeniedCardStubComponent,
            UnitScoreHistoryModalStubComponent,
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UnitsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates the page and loads units on initialization', () => {
    expect(component).toBeTruthy();
    expect(unitsStoreMock.fetchAllUnits).toHaveBeenCalledOnce();
  });

  it('renders the unit and its gender label', () => {
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Alpha',
    );
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Desbravadores',
    );
  });

  it('selects a unit and opens its history modal', () => {
    component.openHistoryModal(mockUnit);
    fixture.detectChanges();

    expect(component.selectedUnit()).toEqual(mockUnit);
    expect(component.isHistoryModalOpen()).toBe(true);
    const modal = (fixture.nativeElement as HTMLElement).querySelector(
      'app-unit-score-history-modal',
    );
    expect(modal).toBeTruthy();
  });

  it('closes the history modal and clears the selected unit', () => {
    component.openHistoryModal(mockUnit);
    component.closeHistoryModal();

    expect(component.isHistoryModalOpen()).toBe(false);
    expect(component.selectedUnit()).toBeNull();
  });

  it('does not fetch units when the user lacks unit.read', () => {
    userCurrentEntity.set({ ...userCurrentEntity()!, roles: [] });
    unitsStoreMock.fetchAllUnits.mockClear();

    component.ngOnInit();

    expect(unitsStoreMock.fetchAllUnits).not.toHaveBeenCalled();
  });
});
