import { DeleteResult, UpdateResult } from 'typeorm';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { User } from '../entities/user.entity';
import { UserDto } from '../dtos/user.dto';

export interface IUsersRepository {
  createUser(
    userDto: UserDto & { mustChangePassword: boolean; tenantId },
  ): Promise<void>;

  findAllUsers(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Omit<User, 'password'>[], number]>;

  findOneByUsername(
    username: string,
    tenantId: string,
  ): Promise<Omit<User, 'password'> | null>;

  updateOwnPassword(
    userId: string,
    tenantId: string,
    passwordHash: string,
  ): Promise<UpdateResult>;

  resetTemporaryPassword(
    username: string,
    tenantId: string,
    passwordHash: string,
  ): Promise<UpdateResult>;

  addRoleToUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void>;

  removeRoleFromUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void>;

  deleteUser(username: string, tenantId: string): Promise<DeleteResult>;
}
