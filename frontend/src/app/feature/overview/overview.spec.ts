import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { OverviewPage } from './overview';
import { EPermission } from '../../core/domain/enums/permissions.enum';
import { UserEntity } from '../../core/domain/entities/user.entity';

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
        permissions: [EPermission.UNIT_READ],
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
    unitsOptions: signal([
      { id: '1', name: 'Unidade Alpha' },
      { id: '2', name: 'Unidade Beta' },
    ]),
    pendingHistories: signal([
      {
        id: 'hist-1',
        tenantId: 'tenant-1',
        unitId: '1',
        score: 50,
        description: 'Participação em evento',
        createdAt: new Date('2026-10-01T10:00:00Z'),
        updatedAt: new Date('2026-10-01T10:00:00Z'),
        requestedBy: { username: 'joao.silva' },
      },
    ]),
    fetchPendingScoreHistories: vi.fn().mockResolvedValue([]),
    fetchAllUnitsOptions: vi.fn().mockResolvedValue([]),
    approveScoreHistory: vi.fn().mockResolvedValue(undefined),
    rejectScoreHistory: vi.fn().mockResolvedValue(undefined),
  };

  const mockAuthStore = {
    logout: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
    refreshToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [OverviewPage],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: mockAuthStore },
        { provide: USERS_STORE_PORT, useValue: mockUsersStore },
        { provide: UNITS_STORE_PORT, useValue: mockUnitsStore },
        { provide: SCORE_HISTORY_STORE_PORT, useValue: mockScoreHistoryStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OverviewPage);
    component = fixture.componentInstance;
  });

  it('should create the component successfully and load data on init', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component).toBeTruthy();
    expect(mockScoreHistoryStore.fetchPendingScoreHistories).toHaveBeenCalled();
    expect(mockScoreHistoryStore.fetchAllUnitsOptions).toHaveBeenCalled();
    expect(mockUnitsStore.fetchAllUnits).toHaveBeenCalled();
  });

  it('should render overview contents, chart items, and pending histories when user has permission', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Bem-vindo, edilson.segundo!');
    expect(element.textContent).toContain('Ranking de Unidade');
    expect(element.textContent).toContain('Pontuações Pendentes');
    expect(element.textContent).toContain('Participação em evento');
    expect(element.textContent).toContain('joao.silva');
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
      'Acesso restrito: você não possui permissão para visualizar o painel de pontuações pendentes e o gráfico de pontuação geral.',
    );
  });

  it('should successfully approve a pending history and refresh units', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    await component.onApprove('hist-1');

    expect(mockScoreHistoryStore.approveScoreHistory).toHaveBeenCalledWith(
      'hist-1',
    );
    expect(mockUnitsStore.fetchAllUnits).toHaveBeenCalled();
  });

  it('should handle error gracefully when approving history fails', async () => {
    mockScoreHistoryStore.approveScoreHistory.mockRejectedValueOnce(
      new Error('Erro ao aprovar'),
    );

    fixture.detectChanges();
    await component.onApprove('hist-1');

    expect(mockScoreHistoryStore.approveScoreHistory).toHaveBeenCalledWith(
      'hist-1',
    );
  });

  it('should successfully reject a pending history', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    await component.onReject('hist-1');

    expect(mockScoreHistoryStore.rejectScoreHistory).toHaveBeenCalledWith(
      'hist-1',
    );
  });

  it('should handle error gracefully when rejecting history fails', async () => {
    mockScoreHistoryStore.rejectScoreHistory.mockRejectedValueOnce(
      new Error('Erro ao rejeitar'),
    );

    fixture.detectChanges();
    await component.onReject('hist-1');

    expect(mockScoreHistoryStore.rejectScoreHistory).toHaveBeenCalledWith(
      'hist-1',
    );
  });

  it('should return a stable id for each pending history item', () => {
    const mockRecord = {
      id: 'rec-123',
      tenantId: 't-1',
      unitId: 'u-1',
      score: 10,
      description: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(component.trackById(0, mockRecord)).toBe('rec-123');
  });

  it('should handle data loading errors gracefully during initialization', async () => {
    mockUnitsStore.fetchAllUnits.mockRejectedValueOnce(
      new Error('Erro de carregamento'),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
  });
});
