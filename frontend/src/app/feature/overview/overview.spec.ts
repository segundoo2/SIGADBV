import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AUTH_STORE_PORT } from '../../core/infra/tokens/auth.token';
import { USERS_STORE_PORT } from '../../core/infra/tokens/users.token';
import { UNITS_STORE_PORT } from '../../core/infra/tokens/units.token';
import { SCORE_HISTORY_STORE_PORT } from '../../core/infra/tokens/score-history.token';
import { Overview } from './overview';
import { EPermission } from '../../core/domain/enums/permissions.enum';

describe('Overview', () => {
  let component: Overview;
  let fixture: ComponentFixture<Overview>;

  const mockUsersStore = {
    userCurrentEntity: signal<any>({
      id: 'da90c852-83de-448b-b794-cefc52925760',
      tenantId: '00000000-0000-0000-0000-000000000000',
      username: 'edilson.segundo',
      mustChangePassword: false,
      roles: [
        {
          id: 'role-admin',
          name: 'Super Usuário',
          permissions: [EPermission.SCORE_HISTORY_READ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    isLoading: signal(false),
    error: signal(null),
    findByUsername: vi.fn(),
    clearSelectedUser: vi.fn(),
  };

  const mockUnitsStore = {
    unitsList: signal([
      { id: '1', name: 'Unidade Alpha', score: 1500 },
      { id: '2', name: 'Unidade Beta', score: -200 },
    ]),
    getAllUnits: vi.fn().mockResolvedValue(undefined),
  };

  const mockScoreHistoryStore = {
    fetchHistory: vi.fn().mockImplementation(async (unitId: string) => {
      if (unitId === 'error-unit') {
        throw new Error('Falha ao buscar histórico');
      }
      return {
        data: [
          {
            id: 'hist-1',
            score: 500,
            description: 'Pontuação positiva',
            createdAt: new Date('2026-10-01T10:00:00Z'),
          },
          {
            id: 'hist-2',
            score: -100,
            description: 'Penalização aplicada',
            createdAt: new Date('2026-10-02T10:00:00Z'),
          },
        ],
      };
    }),
  };

  const mockAuthStore = {
    logout: vi.fn().mockResolvedValue(undefined),
    login: vi.fn(),
    refreshToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [Overview],
      providers: [
        provideRouter([]),
        { provide: AUTH_STORE_PORT, useValue: mockAuthStore },
        { provide: USERS_STORE_PORT, useValue: mockUsersStore },
        { provide: UNITS_STORE_PORT, useValue: mockUnitsStore },
        { provide: SCORE_HISTORY_STORE_PORT, useValue: mockScoreHistoryStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Overview);
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

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Bem-vindo, edilson.segundo!');
    expect(element.textContent).toContain('Ranking de Unidade');
    expect(element.textContent).toContain('Histórico de Pontuações recentes');
  });

  it('should render access denied message when user lacks permission', async () => {
    mockUsersStore.userCurrentEntity.set({
      ...mockUsersStore.userCurrentEntity(),
      roles: [
        {
          id: 'role-guest',
          name: 'Convidado',
          permissions: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    fixture.detectChanges();
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent).toContain('Você não possui permissão para visualizar o histórico detalhado');
  });

 it('should load and sort history records correctly when a unit is selected', async () => {
    // Garante que o usuário possui a permissão necessária para este teste
    mockUsersStore.userCurrentEntity.set({
      id: 'da90c852-83de-448b-b794-cefc52925760',
      tenantId: '00000000-0000-0000-0000-000000000000',
      username: 'edilson.segundo',
      mustChangePassword: false,
      roles: [
        {
          id: 'role-admin',
          name: 'Super Usuário',
          permissions: [EPermission.SCORE_HISTORY_READ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fixture.detectChanges();
    await fixture.whenStable();

    component.unitControl.setValue('1', { emitEvent: true });
    
    await vi.waitFor(() => {
      expect(component.historyRows().length).toBe(2);
    });

    fixture.detectChanges();

    expect(component.historyRows().length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Pontuação positiva');
    expect(fixture.nativeElement.textContent).toContain('Penalização aplicada');
  });

  it('should clear history rows when unitControl is reset/empty', async () => {
    component.unitControl.setValue('1');
    await fixture.whenStable();
    
    expect(component.historyRows().length).toBeGreaterThan(0);

    component.unitControl.setValue('');
    await fixture.whenStable();

    expect(component.historyRows().length).toBe(0);
  });

  it('should handle fetchHistory errors gracefully and clear history', async () => {
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
    mockUnitsStore.getAllUnits.mockRejectedValueOnce(new Error('Erro de conexão'));
    
    await component.ngOnInit();
    expect(mockUnitsStore.getAllUnits).toHaveBeenCalled();
  });
});