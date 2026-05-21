import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { IResponse } from '../../interface/response.interface';

@Injectable()
export class UsersRepository implements IUsersRepository {
  async create(createUserDto: CreateUserDto): Promise<IResponse> {}
}
