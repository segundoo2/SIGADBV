import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUsersService } from './interfaces/users.service.interface';
import type { IUsersRepository } from './interfaces/users.repository.interface';
import { User } from './entities/user.entity';
import * as generatePassword from 'generate-password';
import * as bcrypt from 'bcrypt';
import { UserDto } from './dtos/user.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { UpdateResult } from 'typeorm';
import type { ICacheStorageService } from '../../common/redis/interface/cache-storage.interface';
import { EUsersSuccess } from '../../common/enum/users-sucess.enum';
import { EUsersErrors } from '../../common/enum/users-errors.enum';
import { IResponse } from '../../common/interfaces/response.interface';
import type { IRolesRepository } from '../roles/interfaces/roles.repository.interface';
import { ERolesErrors } from '../../common/enum/roles-errors.enum';
import { ERolesSuccess } from '../../common/enum/roles-success.enum';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@Injectable()
export class UsersService implements IUsersService {
  private readonly SALT_ROUNDS = 10;
  private readonly BLACKLIST_EXPIRATION_SECONDS = 900;

  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
    @Inject('IRolesRepository')
    private readonly rolesRepository: IRolesRepository,
    @Inject('ICacheStorageService')
    private readonly cacheStorage: ICacheStorageService,
  ) {}

  async createUser(userDto: UserDto): Promise<IResponse<string>> {
    const roles = await this.rolesRepository.findRolesByIds(
      userDto.roleIds,
      userDto.tenantId,
    );

    if (roles.length !== userDto.roleIds.length) {
      throw new BadRequestException(ERolesErrors.ROLE_INVALID);
    }

    userDto.password = this.generateTemporaryPassword();

    await this.usersRepository.createUser({
      ...userDto,
      password: await bcrypt.hash(userDto.password, this.SALT_ROUNDS),
    });

    return { message: EUsersSuccess.CREATE_USER, data: userDto.password };
  }

  async findOneByUsername(
    username: string,
    tenantId: string,
  ): Promise<IResponse<Omit<User, 'password'>>> {
    const user = await this.usersRepository.findOneByUsername(
      username,
      tenantId,
    );
    if (!user) {
      throw new NotFoundException(EUsersErrors.USER_NOT_FOUND);
    }

    return {
      message: EUsersSuccess.USER_FOUND,
      data: user,
    };
  }

  async findAllUsers(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Omit<User, 'password'>[]>> {
    const currentPage = pagination.page ?? 1;
    const itemsPerPage = pagination.limit ?? 10;

    const [users, totalItems] = await this.usersRepository.findAllUsers(
      tenantId,
      { page: currentPage, limit: itemsPerPage },
    );

    if (!users || users.length === 0) {
      throw new NotFoundException(EUsersErrors.USERS_NOT_FOUND);
    }

    return {
      message: EUsersSuccess.USERS_FOUND,
      data: users,
      meta: {
        itemCount: users.length,
        totalItems,
        itemsPerPage,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        currentPage,
      },
    };
  }

  async updateUserPassword(
    passwordDto: UpdatePasswordDto,
  ): Promise<IResponse<string | null>> {
    const plainPassword =
      passwordDto.password || this.generateTemporaryPassword();

    const passwordUpdated: UpdateResult =
      await this.usersRepository.updateUserPassword({
        ...passwordDto,
        password: await bcrypt.hash(plainPassword, this.SALT_ROUNDS),
      });

    if (passwordUpdated.affected === 0) {
      throw new NotFoundException(EUsersErrors.USER_NOT_FOUND);
    }

    const returnData = passwordDto.password ? null : plainPassword;

    return { message: EUsersSuccess.PASSWORD_UPDATE, data: returnData };
  }

  async addRoleToUser(
    username: string,
    roleId: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    const user = await this.usersRepository.findOneByUsername(
      username,
      tenantId,
    );
    if (!user) {
      throw new NotFoundException(EUsersErrors.USER_NOT_FOUND);
    }

    const role = await this.rolesRepository.findRoleById(roleId, tenantId);
    if (!role) {
      throw new NotFoundException(ERolesErrors.ROLE_NOT_FOUND);
    }

    const alreadyHasRole = user.roles.some((r) => r.id === roleId);
    if (alreadyHasRole) {
      throw new ConflictException(EUsersErrors.USER_ALREADY_HAS_ROLE);
    }

    await this.usersRepository.addRoleToUser(username, roleId, tenantId);

    return {
      message: ERolesSuccess.ROLE_ADDED,
      data: null,
    };
  }

  async removeRoleFromUser(
    username: string,
    roleId: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    const user = await this.usersRepository.findOneByUsername(
      username,
      tenantId,
    );
    if (!user) {
      throw new NotFoundException(EUsersErrors.USER_NOT_FOUND);
    }

    const hasRole = user.roles.some((r) => r.id === roleId);
    if (!hasRole) {
      throw new NotFoundException(EUsersErrors.USER_DOES_NOT_HAVE_ROLE);
    }

    await this.usersRepository.removeRoleFromUser(username, roleId, tenantId);

    return {
      message: ERolesSuccess.ROLE_REMOVED,
      data: null,
    };
  }

  async deleteUser(
    username: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    const user = await this.usersRepository.findOneByUsername(
      username,
      tenantId,
    );
    if (!user || !user.id) {
      throw new NotFoundException(EUsersErrors.USER_NOT_FOUND);
    }

    await this.usersRepository.deleteUser(username, tenantId);

    const blockKey = `blacklist:user:${user.id}`;
    await this.cacheStorage.setWithExpiry(
      blockKey,
      'deleted',
      this.BLACKLIST_EXPIRATION_SECONDS,
    );

    return { message: EUsersSuccess.DELETE_USER, data: null };
  }

  private generateTemporaryPassword(): string {
    return generatePassword.generate({
      length: 8,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true,
    });
  }
}
