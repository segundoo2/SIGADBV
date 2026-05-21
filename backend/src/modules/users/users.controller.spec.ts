import { BadRequestException } from '@nestjs/common';
import { ESuccess } from '../../enums/success.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersController } from './users.controller';
import { IUsersController } from './interface/controller.interface';
import { IUsersService } from './interface/service.interface';

jest.mock('./users.service');
const usersServiceMock: jest.Mocked<IUsersService> = {
  create: jest.fn(),
};

describe('UsersController', () => {
  const usersController: IUsersController = new UsersController(
    usersServiceMock,
  );

  describe('create', () => {
    it(`should return the response object: { message: '${ESuccess.USER_CREATED}' }`, async () => {
      const createUserDto: CreateUserDto = {
        name: 'Jhon',
        surname: 'Doe',
        username: 'jhon.doe',
        role: 'admin',
        password: 'password123',
      };
      usersServiceMock.create.mockResolvedValue({
        message: ESuccess.USER_CREATED,
      });

      const result = await usersController.create(createUserDto);

      expect(usersServiceMock.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        message: ESuccess.USER_CREATED,
      });
    });

    it('should throw BadRequestException if request data is null', async () => {
      const act = () =>
        usersController.create(null as unknown as CreateUserDto);

      await expect(act).rejects.toThrow(BadRequestException);
    });
  });
});
