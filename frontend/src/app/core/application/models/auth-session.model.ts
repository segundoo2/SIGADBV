import { UserEntity } from '../../domain/entities/user.entity';

export interface IAuthSession {
  user: UserEntity;
  mustChangePassword: boolean;
}
