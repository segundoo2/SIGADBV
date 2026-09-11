import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { UpdatePasswordDto } from '../dtos/update-password.dto';
import { UserDto } from '../dtos/user.dto';
import { User } from '../entities/user.entity';

export interface IUsersService {
  createUser(userDto: UserDto): Promise<IResponse<string>>;

  findAllUsers(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Omit<User, 'password'>[]>>;

  findOneByUsername(
    username: string,
    tenantId: string,
  ): Promise<IResponse<Omit<User, 'password'>>>;

  updateUserPassword(
    passwordDto: UpdatePasswordDto,
  ): Promise<IResponse<string | null>>;

  addRoleToUser(
    username: string,
    roleId: string,
    tenantId: string,
  ): Promise<IResponse<null>>;

  removeRoleFromUser(
    username: string,
    roleId: string,
    tenantId: string,
  ): Promise<IResponse<null>>;

  deleteUser(username: string, tenantId: string): Promise<IResponse<null>>;
}
