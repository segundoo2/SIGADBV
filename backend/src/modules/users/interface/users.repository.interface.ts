import { DeleteResult, UpdateResult } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserDto } from '../dto/user.dto';

export interface IUsersRepository {
  createUser(userDto: UserDto): Promise<void>;
  updateUserPassword(userDto: UserDto): Promise<UpdateResult>;
  findAllUsers(): Promise<Partial<User>[] | null>;
  findOneByUsername(username: string): Promise<Partial<User> | null>;
  deleteUser(username: string): Promise<DeleteResult>;
}
