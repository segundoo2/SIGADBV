import {
  Controller,
  Post,
  Body,
  Inject,
  Get,
  Param,
  HttpStatus,
  Patch,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { IUsersController } from './interface/users.controller.interface';
import type { IUsersService } from './interface/users.service.interface';
import { ESuccess } from './enum/success.enum';
import { UsersResponseDto } from './dto/users-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController implements IUsersController {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) {}

  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: ESuccess.CREATE_USER,
    type: UsersResponseDto,
  })
  @Post()
  async createUser(@Body() userDto: UserDto): Promise<UsersResponseDto> {
    return await this.usersService.createUser(userDto);
  }

  @ApiOperation({ summary: 'Atualizar a senha de um usuário' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: ESuccess.PASSWORD_UPDATE,
    type: UsersResponseDto,
  })
  @Patch()
  async updateUserPassword(
    @Body() userDto: UserDto,
  ): Promise<UsersResponseDto> {
    return await this.usersService.updateUserPassword(userDto);
  }

  @ApiOperation({ summary: 'Buscar lista de usuários' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retorna uma mensagem de status e os dados parciais de todos os usuários cadastrados. Caso não encontre nenhum, retorna NotFoundException.',
    type: UsersResponseDto,
  })
  @Get()
  async findAllUsers(): Promise<UsersResponseDto> {
    return await this.usersService.findAllUsers();
  }

  @ApiOperation({ summary: 'Buscar usuário através do username' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retorna uma mensagem de status e os dados parciais do usuário. Caso não encontre, retorna NotFoundException.',
    type: UsersResponseDto,
  })
  @Get(':username')
  async findOneByUsername(
    @Param('username') username: string,
  ): Promise<UsersResponseDto> {
    return await this.usersService.findOneByUsername(username);
  }

  @ApiOperation({ summary: 'Deleta usuário cadastrado' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Deleta dados do usuário permanentemente no banco de dados',
    type: String,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete()
  async deleteUser(username: string): Promise<string> {
    return await this.usersService.deleteUser(username);
  }
}
