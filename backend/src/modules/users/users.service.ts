import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { IResponse } from '../../interface/response.interface';
import { UsersRepository } from './users.repository';
import { IUsersService } from './interface/service.interface';

@Injectable()
export class UsersService implements IUsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<IResponse> {
    return await this.usersRepository.create(createUserDto);
  }
}
