import { UserDto } from '../dto/user.dto';
import { UsersResponseDto } from '../dto/users-response.dto';

export interface IUsersService {
  createUser(userDto: UserDto): Promise<UsersResponseDto>;
  updateUserPassword(userDto: UserDto): Promise<UsersResponseDto>;
  findAllUsers(): Promise<UsersResponseDto>;
  findOneByUsername(username: string): Promise<UsersResponseDto>;
  deleteUser(username: string): Promise<string>;
}
