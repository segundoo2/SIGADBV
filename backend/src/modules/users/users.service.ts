import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { IUsersService } from './interface/users.service.interface';
import type { IUsersRepository } from './interface/users.repository.interface';
import { User } from './entities/user.entity';
import { EErrors } from './enum/errors.enum';
import { ESuccess } from './enum/success.enum';
import { UsersResponseDto } from './dto/users-response.dto';
import * as generatePassword from 'generate-password';
import { DeleteResult } from 'typeorm';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @Inject('IUsersRepository')
    private readonly usersRepository: IUsersRepository,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    await this.verifyUserNotExisting(dto.username);
    return await this.usersRepository.createUser(dto);
  }

  private async verifyUserNotExisting(username: string) {
    this.verifyInvalidUsername(username);
    const user: Partial<User> | null =
      await this.usersRepository.findOneByUsername(username);
    if (user) {
      throw new ConflictException(EErrors.USERNAME_EXIST);
    }
  }

  async updateUserPassword(username: string): Promise<string> {
    this.verifyInvalidUsername(username);
    const user: Partial<User> = await this.getExistingUser(username);
    return this.usersRepository.updateUserPassword({
      ...user,
      password: this.generateTemporaryPassword(),
    });
  }

  private generateTemporaryPassword() {
    return generatePassword.generate({
      length: 8,
      numbers: true,
      symbols: true,
      uppercase: true,
      lowercase: true,
      strict: true,
    });
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

    if (response.affected !== 0) {
      throw new NotFoundException(EErrors.USER_NOT_FOUND);
    }
    return ESuccess.DELETE_USER;
  }

  private verifyInvalidUsername(username: string) {
    if (!username || username.trim() === '') {
      throw new BadRequestException(EErrors.USERNAME_INVALID);
    }
  }
}
