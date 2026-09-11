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
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiCookieAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { IUsersController } from './interfaces/users.controller.interface';
import type { IUsersService } from './interfaces/users.service.interface';
import { EUsersSuccess } from '../../common/enum/users-sucess.enum';
import { UserDto } from './dtos/user.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { User } from './entities/user.entity';
import { IResponse } from '../../common/interfaces/response.interface';
import { EPermission } from '../../common/enum/permissions.enum';
import { RequiresPermission } from '../../common/decorators/permission.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@ApiTags('Users')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('users')
export class UsersController implements IUsersController {
  constructor(
    @Inject('IUsersService') private readonly usersService: IUsersService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequiresPermission(EPermission.USERS_CREATE)
  @ApiOperation({ summary: 'Criar um novo usuário' })
  @ApiBody({ type: UserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: EUsersSuccess.CREATE_USER,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de validação inválidos.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado: permissão insuficiente.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token de acesso inválido ou ausente.',
  })
  async createUser(
    @Body() userDto: UserDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<string>> {
    userDto.tenantId = tenantId;
    return await this.usersService.createUser(userDto);
  }

  @Get(':username')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.USERS_READ)
  @ApiOperation({ summary: 'Buscar usuário através do username' })
  @ApiParam({
    name: 'username',
    description: 'O username único do usuário',
    example: 'segundo',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retorna uma mensagem de status e os dados parciais do usuário encontrado.',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  async findOneByUsername(
    @Param('username') username: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<Omit<User, 'password'>>> {
    return await this.usersService.findOneByUsername(username, tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.USERS_READ)
  @ApiOperation({ summary: 'Buscar lista de todos os usuários' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Retorna uma mensagem de status, os dados parciais paginados e metadados de paginação.',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nenhum usuário cadastrado no sistema.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  async findAllUsers(
    @TenantId() tenantId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Omit<User, 'password'>[]>> {
    return await this.usersService.findAllUsers(tenantId, pagination);
  }

  @Patch()
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.USERS_UPDATE)
  @ApiOperation({ summary: 'Atualizar a senha de um usuário autenticado' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: EUsersSuccess.PASSWORD_UPDATE,
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Senha atual incorreta ou nova senha inválida.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  async updateUserPassword(
    @Body() userDto: UpdatePasswordDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<string | null>> {
    userDto.tenantId = tenantId;
    return await this.usersService.updateUserPassword(userDto);
  }

  @Post(':username/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.USERS_UPDATE)
  @ApiOperation({ summary: 'Adicionar uma Role específica ao usuário' })
  async addRoleToUser(
    @Param('username') username: string,
    @Param('roleId') roleId: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.usersService.addRoleToUser(username, roleId, tenantId);
  }

  @Delete(':username/roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.USERS_UPDATE)
  @ApiOperation({ summary: 'Remover uma Role específica do usuário' })
  async removeRoleFromUser(
    @Param('username') username: string,
    @Param('roleId') roleId: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.usersService.removeRoleFromUser(
      username,
      roleId,
      tenantId,
    );
  }

  @Delete(':username')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequiresPermission(EPermission.USERS_DELETE)
  @ApiOperation({
    summary: 'Deleta um usuário cadastrado permanentemente',
  })
  @ApiParam({
    name: 'username',
    description: 'O username do usuário a ser deletado',
    example: 'segundo',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description:
      'Usuário deletado com sucesso do banco de dados. Sem conteúdo de retorno.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado.',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado: permissão insuficiente.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Não autorizado.',
  })
  async deleteUser(
    @Param('username') username: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.usersService.deleteUser(username, tenantId);
  }
}
