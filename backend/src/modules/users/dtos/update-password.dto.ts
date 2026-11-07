import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { EUsersErrors } from '../../../common/enum/user/users-errors.enum';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Nova senha permanente da conta autenticada.',
    example: '12345678',
    minLength: 8,
    maxLength: 12,
  })
  @IsString({
    message: `${EUsersErrors.USERNAME} ${EUsersErrors.CARACTERS_INVALID}`,
  })
  @IsNotEmpty({ message: EUsersErrors.PASSWORD_INCORRECT })
  @Length(8, 12, {
    message: 'A senha deve ter no mínimo 8 e no máximo 12 caracteres',
  })
  password!: string;
}
