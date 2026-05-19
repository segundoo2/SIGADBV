import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { EErrors } from '../../enums/errors.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    if (!createUserDto) {
      throw new BadRequestException(EErrors.USER_DATA_INVALID);
    }

    return this.usersService.create(createUserDto);
  }
}
