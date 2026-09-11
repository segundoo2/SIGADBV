import { DeleteResult, UpdateResult } from 'typeorm';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { UpdatePasswordDto } from '../dtos/update-password.dto';
import { User } from '../entities/user.entity';

export interface IUsersRepository {
  createUser(userData: Partial<User>): Promise<void>;

  findAllUsers(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Omit<User, 'password'>[], number]>;

  findOneByUsername(
    username: string,
    tenantId: string,
  ): Promise<Omit<User, 'password'> | null>;

  updateUserPassword(passwordDto: UpdatePasswordDto): Promise<UpdateResult>;

  addRoleToUser(
    username: string,
    roleId: string,
    tenantId: string,
  ): Promise<void>;

  removeRoleFromUser(
    username: string,
    roleId: string,
    tenantId: string,
  ): Promise<void>;

  deleteUser(username: string, tenantId: string): Promise<DeleteResult>;
}
