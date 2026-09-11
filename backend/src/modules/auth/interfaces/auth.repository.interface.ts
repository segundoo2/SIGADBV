import { User } from '../../users/entities/user.entity';

export interface IAuthRepository {
  findUserByUsername(username: string, tenantId: string): Promise<User | null>;
}
