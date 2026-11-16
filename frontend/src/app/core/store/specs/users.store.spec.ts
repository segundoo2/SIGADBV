import { TestBed } from '@angular/core/testing';
import { UsersStore } from '../users.store';
import { USERS_API_PORT } from '../../infra/tokens/users.token';
import { UserEntity } from '../../domain/entities/user.entity';

describe('UsersStore', () => {
  let store: UsersStore;
  let apiUsersMock: {
    createUser: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiUsersMock = {
      createUser: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UsersStore,
        { provide: USERS_API_PORT, useValue: apiUsersMock },
      ],
    });

    store = TestBed.inject(UsersStore);
  });

  const username = 'edilson.segundo';
  const tenantId = '00000000-0000-0000-0000-000000000000';

  const user: UserEntity = {
    id: 'da90c852-83de-448b-b794-cefc52925760',
    tenantId,
    username,
    mustChangePassword: false,
    roles: [],
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-02T10:00:00.000Z'),
  };

  it('should be created', () => {
    expect(store).toBeTruthy();
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  describe('createUser', () => {
    it('should create a user and return temporary password', async () => {
      const temporaryPassword = 'temporaryPassword123';

      apiUsersMock.createUser.mockResolvedValue(temporaryPassword);

      const promise = store.createUser({
        username: user.username,
        roleIds: user.roles.map((role) => role.id),
      });

      await expect(promise).resolves.toEqual(temporaryPassword);
    });
  });
});
