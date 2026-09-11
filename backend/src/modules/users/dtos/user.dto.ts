import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  Length,
  IsBoolean,
  IsArray,
  IsUUID,
} from 'class-validator';
import { EUsersErrors } from '../../../common/enum/users-errors.enum';

export abstract class UserDto {
  tenantId!: string;

  @ApiProperty({ example: 'edilson.segundo' })
  @IsString({
    message: `${EUsersErrors.USERNAME} ${EUsersErrors.CARACTERS_INVALID}`,
  })
  @IsNotEmpty({ message: EUsersErrors.USERNAME_INVALID })
  @Matches(/^[a-z0-9]+(?:\.[a-z0-9]+)+$/, {
    message: EUsersErrors.USERNAME_INVALID,
  })
  username!: string;

  @ApiProperty({
    description: 'Array de UUIDs das Roles atribuídas ao usuário',
    example: ['c22e5a7d-b2b2-4d76-8809-51a81231f24d'],
  })
  @IsArray()
  @IsUUID('4', { each: true, message: EUsersErrors.ROLE_INVALID })
  @IsNotEmpty({ message: EUsersErrors.ROLE_INVALID })
  roleIds!: string[];

  @ApiProperty()
  @IsBoolean({ message: EUsersErrors.MUST_CHANGE_PASSWORD_INVALID })
  @IsNotEmpty({ message: EUsersErrors.MUST_CHANGE_PASSWORD_INVALID })
  mustChangePassword!: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Length(8, 12, {
    message: 'A senha deve ter no mínimo 8 e no máximo 12 caracteres',
  })
  password?: string;
}
