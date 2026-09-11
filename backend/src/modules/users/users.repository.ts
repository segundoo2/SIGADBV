import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { IUsersRepository } from './interfaces/users.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import {
  DeleteResult,
  QueryFailedError,
  Repository,
  UpdateResult,
} from 'typeorm';
import { EErrorsGlobal } from '../../common/enum/errors-global.enum';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { IDatabaseDriverError } from '../../common/interfaces/database-driver-Error.interface';
import { EUsersErrors } from '../../common/enum/users-errors.enum';
import { UserDto } from './dtos/user.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
  ) {}

  async createUser(userDto: UserDto): Promise<void> {
    try {
      // Mapeia o array de UUIDs (roleIds) para o formato { id } que a entity exige
      const user = this.repository.create({
        username: userDto.username,
        password: userDto.password,
        tenantId: userDto.tenantId,
        mustChangePassword: userDto.mustChangePassword,
        roles: userDto.roleIds.map((id) => ({ id })),
      });

      await this.repository.save(user);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as IDatabaseDriverError;
        if (driverError.code === '23505') {
          throw new ConflictException(EUsersErrors.USERNAME_EXIST);
        }
      }
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findOneByUsername(
    username: string,
    tenantId: string,
  ): Promise<Omit<User, 'password'> | null> {
    try {
      return await this.repository.findOne({
        where: { username, tenantId },
        relations: {
          roles: true,
        },
        select: {
          id: true,
          username: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllUsers(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Omit<User, 'password'>[], number]> {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 10;
      const skip = (page - 1) * limit;

      return await this.repository.findAndCount({
        where: { tenantId },
        relations: {
          roles: true,
        },
        select: {
          id: true,
          username: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async updateUserPassword(
    passwordDto: UpdatePasswordDto,
  ): Promise<UpdateResult> {
    try {
      return await this.repository.update(
        { username: passwordDto.username, tenantId: passwordDto.tenantId },
        {
          password: passwordDto.password,
          mustChangePassword: passwordDto.mustChangePassword,
        },
      );
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async addRoleToUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      await this.repository
        .createQueryBuilder()
        .relation(User, 'roles')
        .of({ id: userId, tenantId })
        .add(roleId);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async removeRoleFromUser(
    userId: string,
    roleId: string,
    tenantId: string,
  ): Promise<void> {
    try {
      await this.repository
        .createQueryBuilder()
        .relation(User, 'roles')
        .of({ id: userId, tenantId })
        .remove(roleId);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async deleteUser(username: string, tenantId: string): Promise<DeleteResult> {
    try {
      return await this.repository.delete({ username, tenantId });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
