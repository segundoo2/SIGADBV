import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { EPermission } from '../../../common/enum/permissions.enum';

export class RoleDto {
  tenantId!: string;

  @ApiProperty({ example: 'Operador de Estoque' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  name!: string;

  @ApiProperty({
    example: [EPermission.PRODUCTS_READ, EPermission.ROLES_CREATE],
    enum: EPermission,
    isArray: true,
  })
  @IsArray()
  @IsEnum(EPermission, { each: true })
  permissions!: EPermission[];
}
