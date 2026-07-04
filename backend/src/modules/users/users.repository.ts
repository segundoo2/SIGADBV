import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { IUsersRepository } from './interface/users.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { DeleteResult, Repository } from 'typeorm';
import { ESuccess } from './enum/success.enum';
import { EErrorsGlobal } from '../../enum/errors-global.enum';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(User) private readonly repository: Repository<User>,
  ) {}

  async createUser(dto: CreateUserDto): Promise<string> {
    try {
      const user: User = this.repository.create(dto);

      await this.repository.save(user);

      return ESuccess.USER_REGISTER;
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async updateUserPassword(user: User): Promise<string> {
    try {
      await this.repository.save(user);
      return user.password;
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllUsers(): Promise<Partial<User>[] | null> {
    try {
      const users: Partial<User>[] = await this.repository.find({
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return users.length === 0 ? null : users;
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findOneByUsername(username: string): Promise<User | null> {
    try {
      return await this.repository.findOne({
        where: { username },
        select: {
          id: true,
          username: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async deleteUser(username: string): Promise<DeleteResult> {
    try {
      return await this.repository.delete(username);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
