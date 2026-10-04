import { UserEntity } from '../../../domain/entities/user.entity';

export interface IUsersApiPort {
  getUserByUsername(username: string, tenantId: string): Promise<UserEntity>;
}
