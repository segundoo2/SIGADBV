import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { OverviewPage } from './overview';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { UserEntity } from '../../core/domain/entities/user.entity';
import {
  EScoreHistoryStatus,
  IScoreHistoryEntity,
} from '../../core/domain/entities/score-history.entity';

@Component({
  standalone: true,
  selector: 'app-lucide-icon',
  template: '<span></span>',
})
class LucideIconStubComponent {
  @Input() name?: string;
  @Input() img?: unknown;
}

describe('OverviewPage', () => {
  let component: OverviewPage;
  let fixture: ComponentFixture<OverviewPage>;

  const mockUser: UserEntity = {
    id: 'da90c852-83de-448b-b794-cefc52925760',
    tenantId: '00000000-0000-0000-0000-000000000000',
    username: 'edilson.segundo',
    mustChangePassword: false,
    roles: [
      {
        id: 'role-admin',
        tenantId: '00000000-0000-0000-0000-000000000000',
        name: 'Super Usuário',
        permissions: [EPermission.SCORE_HISTORY_READ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersStore = {
    userCurrentEntity: signal<UserEntity | null>(mockUser),
    isLoading: signal(false),
    error: signal(null),
    findByUsername: vi.fn(),
    clearCurrentUser: vi.fn(),
  };

  const mockUnitsStore = {
    unitsList: signal([
      { id: '1', name: 'Unidade Alpha', score: 1500 },
      { id: '2', name: 'Unidade Beta', score: -200 },
    ]),
    fetchAllUnits: vi.fn().mockResolvedValue([]),
  };

  const mockScoreHistoryStore = {
    fetchUnitScoreHistory: vi.fn().mockImplementation((unitId: string) => {
      if (unitId === 'error-unit') {
        return Promise.reject(new Error('Falha ao buscar histórico'));
      }
      const history: IScoreHistoryEntity[] = [
        {
          id: 'hist-1',
          tenantId: 'tenant-1',
          unitId,
          score: 500,
          description: 'Pontuação positiva',
          status: EScoreHistoryStatus.PENDING,
          requestedById: 'user-1',
          createdAt: new Date('2026-10-01T10:00:00Z'),
          updatedAt: new Date('2026-10-01T10:00:00Z'),
        },
        {
          id: 'hist-2',
          tenantId: 'tenant-1',
          unitId,
          score: -100,
          description: 'Penalização aplicada',
          status: EScoreHistoryStatus.PENDING,
          requestedById: 'user-1',
          createdAt: new Date('2026-10-02T10:00:00Z'),
          updatedAt: new Date('2026-10-02T10:00:00Z'),
        },
      ];
      return Promise.resolve(history);
    }),
    approveScore: vi.fn().mockResolvedValue(undefined),
    rejectScore: vi.fn().mockResolvedValue(undefined),
  };

  const mockAuthStore = {
    logout: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
    refreshToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUsersStore.userCurrentEntity.set(mockUser);

    await TestBed.configureTestingModule({
      imports: [OverviewPage],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: mockAuthStore },
        { provide: USERS_STORE_PORT, useValue: mockUsersStore },
        { provide: UNITS_STORE_PORT, useValue: mockUnitsStore },
        { provide: SCORE_HISTORY_STORE_PORT, useValue: mockScoreHistoryStore },
      ],
    })
      .overrideComponent(OverviewPage, {
        set: {
          imports: [LucideIconStubComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(OverviewPage);
    component = fixture.componentInstance;
  });

  it('should create the component successfully', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should render score history and charts when user has permission', async () => {
    component.unitControl.setValue('1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Bem-vindo, edilson.segundo!');
    expect(element.textContent).toContain('Unidades Cadastradas');
    expect(element.textContent).toContain(
      'Selecione uma unidade para visualizar o histórico de pontuações pendentes.',
    );
  });

  it('should render access denied message when user lacks permission', async () => {
    mockUsersStore.userCurrentEntity.set({
      ...mockUser,
      roles: [
        {
          id: 'role-guest',
          tenantId: '00000000-0000-0000-0000-000000000000',
          name: 'Convidado',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain(
      'Acesso restrito: você não possui permissão para visualizar o histórico de pontuações pendentes e o gráfico de pontuação geral.',
    );
  });

  it('should load and sort history records correctly when a unit is selected', async () => {
    mockUsersStore.userCurrentEntity.set({
      ...mockUser,
    });

    fixture.detectChanges();
    await fixture.whenStable();

    component.unitControl.setValue('1', { emitEvent: true });

    await vi.waitFor(() => {
      expect(component.historyRows().length).toBe(2);
    });

    fixture.detectChanges();

    expect(component.historyRows().length).toBe(2);
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Pontuação positiva');
    expect(element.textContent).toContain('Penalização aplicada');
  });

  it('should clear history rows when unitControl is reset/empty', async () => {
    component.unitControl.setValue('1');
    await fixture.whenStable();

    expect(component.historyRows().length).toBeGreaterThan(0);

    component.unitControl.setValue('');
    await fixture.whenStable();

    expect(component.historyRows().length).toBe(0);
  });

  it('should handle history fetch errors and clear history', async () => {
    component.unitControl.setValue('error-unit');
    await fixture.whenStable();

    expect(component.historyRows()).toEqual([]);
  });

  it('should return a stable id for each score history row', async () => {
    component.unitControl.setValue('1');
    await fixture.whenStable();

    component.historyRows().forEach((record, index) => {
      expect(component.trackById(index, record)).toBe(record.id);
    });
  });

  it('should handle units fetch error gracefully during ngOnInit', async () => {
    mockUnitsStore.fetchAllUnits.mockRejectedValueOnce(
      new Error('Erro de conexão'),
    );

    fixture.detectChanges();
    await vi.waitFor(() => {
      expect(mockUnitsStore.fetchAllUnits).toHaveBeenCalled();
    });
  });

  it('should approve a score history record', async () => {
    component.unitControl.setValue('1');
    await fixture.whenStable();

    await component.approveScore('hist-1');
    expect(mockScoreHistoryStore.approveScore).toHaveBeenCalledWith('hist-1');
  });

  it('should reject a score history record', async () => {
    component.unitControl.setValue('1');
    await fixture.whenStable();

    await component.rejectScore('hist-1');
    expect(mockScoreHistoryStore.rejectScore).toHaveBeenCalledWith('hist-1');
  });
});
