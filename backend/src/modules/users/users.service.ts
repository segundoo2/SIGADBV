import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUsersService } from './interface/users.service.interface';
import type { IUsersRepository } from './interface/users.repository.interface';
import { User } from './entities/user.entity';
import { EErrors } from './enum/errors.enum';
import { ESuccess } from './enum/success.enum';
import { UsersResponseDto } from './dto/users-response.dto';
import * as generatePassword from 'generate-password';
import { DeleteResult, UpdateResult } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  //utilizado pela maioria dos métodos CRUD
  private verifyInvalidUsername(username: string) {
    if (!username || username.trim() === '') {
      throw new BadRequestException(EErrors.USERNAME_INVALID);
    }
  }

  saltRounds: number = 10;

  async createUser(userDto: UserDto): Promise<UsersResponseDto> {
    await this.verifyUserNotExisting(userDto.username);
    userDto.password = this.generateTemporaryPassword();
    await this.usersRepository.createUser({
      ...userDto,
      password: await bcrypt.hash(userDto.password, this.saltRounds),
    });
    return { message: ESuccess.CREATE_USER, data: userDto.password };
  }

  private async verifyUserNotExisting(username: string) {
    this.verifyInvalidUsername(username);
    const user: Partial<User> | null =
      await this.usersRepository.findOneByUsername(username);
    if (user) {
      throw new ConflictException(EErrors.USERNAME_EXIST);
    }
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

  async updateUserPassword(userDto: UserDto): Promise<UsersResponseDto> {
    this.verifyInvalidUsername(userDto.username);
    let passwordUpdated: UpdateResult;

    if (!userDto.password) {
      userDto.password = this.generateTemporaryPassword();
      passwordUpdated = await this.usersRepository.updateUserPassword({
        ...userDto,
        password: await bcrypt.hash(userDto.password, this.saltRounds),
      });

      if (passwordUpdated.affected === 0) {
        throw new NotFoundException(EErrors.USER_NOT_FOUND);
      }

      return { message: ESuccess.PASSWORD_UPDATE, data: userDto.password };
    }

    passwordUpdated = await this.usersRepository.updateUserPassword({
      ...userDto,
      password: await bcrypt.hash(userDto.password, 10),
    });

    if (passwordUpdated.affected === 0) {
      throw new NotFoundException(EErrors.USER_NOT_FOUND);
    }

    return { message: ESuccess.PASSWORD_UPDATE, data: null };
  }

  async findAllUsers(): Promise<UsersResponseDto> {
    return {
      message: ESuccess.USERS_FOUND,
      data: await this.getExistingUsersList(),
    };
  }

  private async getExistingUsersList(): Promise<Partial<User>[]> {
    const usersList: Partial<User>[] | null =
      await this.usersRepository.findAllUsers();
    if (!usersList) {
      throw new NotFoundException(EErrors.USERS_NOT_FOUND);
    }
    return usersList;
  }

  async findOneByUsername(username: string): Promise<UsersResponseDto> {
    this.verifyInvalidUsername(username);
    return {
      message: ESuccess.USER_FOUND,
      data: await this.getExistingUser(username),
    };
  }

  private async getExistingUser(username: string): Promise<Partial<User>> {
    const existingUser: Partial<User> | null =
      await this.usersRepository.findOneByUsername(username);
    if (!existingUser) {
      throw new NotFoundException(EErrors.USER_NOT_FOUND);
    }
    return existingUser;
  }

  async deleteUser(username: string): Promise<string> {
    this.verifyInvalidUsername(username);
    const response: DeleteResult =
      await this.usersRepository.deleteUser(username);

    if (response.affected === 0) {
      throw new NotFoundException(EErrors.USER_NOT_FOUND);
    }
    return ESuccess.DELETE_USER;
  }
}
