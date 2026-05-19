import { BadRequestException } from '@nestjs/common';
import { ESuccess } from '../../enums/success.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

jest.mock('./users.service');

describe('UsersController', () => {
  let usersService: jest.Mocked<UsersService>;
  let usersController: UsersController;

  beforeEach(() => {
    jest.clearAllMocks();

    usersService = jest.mocked(new UsersService());
    usersController = new UsersController(usersService);
  });

  describe('create', () => {
    it(`should return message ${ESuccess.USER_CREATED}`, async () => {
      const createUserDto: CreateUserDto = {
        name: 'Jhon',
        surname: 'Doe',
        username: 'jhon.doe',
        role: 'admin',
        password: 'password123',
      };
      const createSpy = jest.spyOn(usersService, 'create').mockResolvedValue({
        message: ESuccess.USER_CREATED,
      });

      const result = await usersController.create(createUserDto);

      expect(createSpy).toHaveBeenCalledWith(createUserDto);
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
