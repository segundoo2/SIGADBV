import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { EErrors } from '../../enums/errors.enum';
import { IUsersController } from './interface/controller.interface';
import type { IUsersService } from './interface/service.interface';

@Controller('users')
export class UsersController implements IUsersController {
  constructor(private readonly usersService: IUsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    if (!createUserDto) {
      throw new BadRequestException(EErrors.USER_DATA_INVALID);
    }

    return this.usersService.create(createUserDto);
  }
}
