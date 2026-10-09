import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EPermission } from '../../../core/domain/enums/permissions.enum';
import { USERS_STORE_PORT } from '../../../core/infra/tokens/users.token';
import { AccessDeniedCard } from '../access-denied-card.component';
import { UserEntity } from '../../../core/domain/entities/user.entity';

describe('AccessDeniedCard', () => {
  let component: AccessDeniedCard;
  let fixture: ComponentFixture<AccessDeniedCard>;

  const mockUser: UserEntity = {
    id: '1',
    tenantId: 'tenant-1',
    username: 'edilson.segundo',
    mustChangePassword: false,
    roles: [
      {
        id: 'role-1',
        tenantId: 'tenant-1',
        name: 'Admin',
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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccessDeniedCard],
      providers: [{ provide: USERS_STORE_PORT, useValue: mockUsersStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessDeniedCard);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render content when no permission is required', () => {
    component.requiredPermission = null;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain('Você não possui permissão');
  });

  it('should render content when user has the required permission', () => {
    component.requiredPermission = EPermission.SCORE_HISTORY_READ;
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).not.toContain('Você não possui permissão');
  });

  it('should render access denied message when user lacks the required permission', () => {
    component.requiredPermission = EPermission.SCORE_HISTORY_ADJUST;
    component.message = 'Acesso personalizado negado.';
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Acesso personalizado negado.');
  });
});
