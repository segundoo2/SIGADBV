import { ESuccess } from '../../enums/success.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { IUsersRepository } from './interface/repository.interface';
import { IUsersService } from './interface/service.interface';
import { UsersService } from './users.service';

jest.mock('./users.repository');
const usersRepositoryMock: jest.Mocked<IUsersRepository> = {
  create: jest.fn(),
};

describe('UsersService', () => {
  const usersService: IUsersService = new UsersService(usersRepositoryMock);

  describe('create', () => {
    it(`should return the response object: { message: ${ESuccess.USER_CREATED} }`, async () => {
      const createUserDto: CreateUserDto = {
        name: 'Jhon',
        surname: 'Doe',
        username: 'jhon.doe',
        role: 'admin',
        password: 'password123',
      };

      usersRepositoryMock.create.mockResolvedValue({
        message: ESuccess.USER_CREATED,
      });

      const result = await usersService.create(createUserDto);

      expect(usersRepositoryMock.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        message: ESuccess.USER_CREATED,
      });
    });
  });
});
