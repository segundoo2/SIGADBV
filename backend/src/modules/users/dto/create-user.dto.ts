import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { EErrors } from '../enum/errors.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome único do usuário para login e identificação.',
    example: 'edilson.segundo',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50, { message: EErrors.USERNAME_LENGTH })
  @Matches(/^[a-z0-9.]+$/, {
    message: EErrors.USERNAME_CHARACTERS,
  })
  username!: string;

  @ApiProperty({
    description: 'Senha do usuário.',
    example: '12345678',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20, { message: 'A senha deve ter entre 8 e 20 caracteres.' })
  password!: string;
}
