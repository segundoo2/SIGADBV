import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { IResponse } from '../../interface/response.interface';
import { ESuccess } from '../../enums/success.enum';

@Injectable()
export class UsersService {
  async create(createUserDto: CreateUserDto): Promise<IResponse> {
  }
}
