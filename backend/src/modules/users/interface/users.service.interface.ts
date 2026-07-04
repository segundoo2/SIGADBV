import { CreateUserDto } from '../dto/create-user.dto';
import { UsersResponseDto } from '../dto/users-response.dto';

export interface IUsersService {
  createUser(createUserDto: CreateUserDto): Promise<string>;
  updateUserPassword(username: string): Promise<string>;
  findAllUsers(): Promise<UsersResponseDto>;
  findOneByUsername(username: string): Promise<UsersResponseDto>;
  deleteUser(username: string): Promise<string>;
}
