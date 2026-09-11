import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import {
  ALL_PERMISSIONS,
  EPermission,
  SYSTEM_ADMIN_ROLE_NAME,
} from '../../common/enum/permissions.enum';

export class PermissionsMetadataDto {
  @ApiProperty({
    description: 'Lista completa de permissões disponíveis no sistema',
    enum: EPermission,
    enumName: 'EPermission',
    isArray: true,
    example: ALL_PERMISSIONS,
  })
  permissions!: EPermission[];

  @ApiProperty({
    description: 'Nome base da role de administrador do sistema',
    example: SYSTEM_ADMIN_ROLE_NAME,
  })
  systemAdminRole!: string;
}

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar metadados de permissões do sistema',
    description:
      'Endpoint utilitário utilizado para expor a enum EPermission e metadados ao frontend.',
  })
  @ApiOkResponse({
    type: PermissionsMetadataDto,
    description: 'Permissões carregadas com sucesso',
  })
  getPermissions(): PermissionsMetadataDto {
    return {
      permissions: ALL_PERMISSIONS,
      systemAdminRole: SYSTEM_ADMIN_ROLE_NAME,
    };
  }
}
