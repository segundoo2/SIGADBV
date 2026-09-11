import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  Length,
  IsBoolean,
} from 'class-validator';
import { EUsersErrors } from '../../../common/enum/users-errors.enum';

export abstract class UpdatePasswordDto {
  @ApiProperty({
    description: 'Id da empresa no qual o usuário pertence',
    example: 'uuid',
  })
  tenantId!: string;

  @ApiProperty({
    description: 'Nome do usuário deve está no formato: nome.sobrenome',
    example: 'edilson.segundo',
  })
  @IsString({
    message: `${EUsersErrors.USERNAME} ${EUsersErrors.CARACTERS_INVALID}`,
  })
  @IsNotEmpty({ message: EUsersErrors.USERNAME_INVALID })
  @Matches(/^[a-z0-9]+(?:\.[a-z0-9]+)+$/, {
    message: EUsersErrors.USERNAME_INVALID,
  })
  username!: string;

  @ApiProperty({
    description: 'Deve está true quando a senha temporária for gerada',
  })
  @IsBoolean({ message: EUsersErrors.MUST_CHANGE_PASSWORD_INVALID })
  @IsNotEmpty({ message: EUsersErrors.MUST_CHANGE_PASSWORD_INVALID })
  mustChangePassword!: boolean;

  @ApiProperty({
    description:
      'Senha definitiva do usuário. Deve ser passada apenas após o primeiro do usuário ou no primeiro login após redifinição de senha.',
    example: '12345678',
    minLength: 8,
    maxLength: 12,
  })
  @IsString({
    message: `${EUsersErrors.USERNAME} ${EUsersErrors.CARACTERS_INVALID}`,
  })
  @IsOptional()
  @Length(8, 12, {
    message: 'A senha deve ter no mínimo 8 e no máximo 12 caracteres',
  })
  password?: string;
}
