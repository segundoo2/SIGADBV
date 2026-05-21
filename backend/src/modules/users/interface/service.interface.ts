import { IResponse } from '../../../interface/response.interface';
import { CreateUserDto } from '../dto/create-user.dto';

export interface IUsersService {
  create(createUserDto: CreateUserDto): Promise<IResponse>;
}
