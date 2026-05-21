import { IResponse } from '../../../interface/response.interface';
import { CreateUserDto } from '../dto/create-user.dto';

export interface IUsersController {
  create(createUserDto: CreateUserDto): Promise<IResponse>;
}
