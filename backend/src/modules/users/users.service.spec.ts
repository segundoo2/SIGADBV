import { InternalServerErrorException } from '@nestjs/common';
import { ESuccess } from '../../enums/success.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { IUsersRepository } from './interface/repository.interface';
import { IUsersService } from './interface/service.interface';
import { UsersService } from './users.service';
import { EErrors } from '../../enums/errors.enum';

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

    it('should throw an InternalServerErrorException if the repository throws an error', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Jhon',
        surname: 'Doe',
        username: 'jhon.doe',
        role: 'admin',
        password: 'password123',
      };

      const error = new InternalServerErrorException(
        EErrors.INTERNAL_SERVER_ERROR,
      );
      usersRepositoryMock.create.mockRejectedValue(error);

      const result = usersService.create(createUserDto);
      await expect(result).rejects.toThrow(error);
    });

    it('should throw an ConflictException if the repository throws a username already exists error', async () => {
      // implementar depois
    });
  });
});
