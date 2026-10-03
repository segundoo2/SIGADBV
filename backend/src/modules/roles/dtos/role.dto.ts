import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { EPermission } from '../../../common/enum/role/permissions.enum';
import { ERolesErrors } from '../../../common/enum/role/roles-errors.enum';

export class RoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString({ message: ERolesErrors.ROLE_INVALID })
  @IsNotEmpty({ message: ERolesErrors.ROLE_INVALID })
  @Length(2, 50)
  name!: string;

  @ApiProperty({
    example: [EPermission.PRODUCTS_READ, EPermission.ROLES_CREATE],
    enum: EPermission,
    isArray: true,
  })
  @IsArray()
  @IsEnum(EPermission, { each: true, message: ERolesErrors.ROLES_NOT_FOUND })
  permissions!: EPermission[];
}
