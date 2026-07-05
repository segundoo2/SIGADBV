import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  IsOptional,
  Length,
} from 'class-validator';
import { EErrors } from '../enum/errors.enum';

export abstract class UserDto {
  @ApiProperty({
    description: 'Nome do usuário deve está no formato: nome.sobrenome',
    example: 'edilson.segundo',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:\.[a-z0-9]+)+$/, {
    message: EErrors.USERNAME_INVALID,
  })
  username!: string;
  @ApiProperty({
    description:
      'Senha definitiva do usuário. Deve ser passada apenas após o primeiro do usuário ou no primeiro login após redifinição de senha.',
    example: '12345678',
    minLength: 8,
    maxLength: 12,
  })
  @IsString()
  @IsOptional()
  @Length(8, 12, {
    message: 'A senha deve ter no mínimo 8 e no máximo 12 caracteres',
  })
  password?: string;
}
