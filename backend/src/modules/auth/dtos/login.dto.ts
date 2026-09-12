import { ApiProperty } from '@nestjs/swagger';
import { EAuthErrors } from '../../../common/enum/auth-errors.enum';
import { EUsersErrors } from '../../../common/enum/users-errors.enum';
import { IsNotEmpty, IsString } from 'class-validator';

export abstract class LoginDto {
  @ApiProperty({ example: 'sgcode' })
  @IsNotEmpty({ message: EAuthErrors.SLUG_INVALID })
  @IsString({ message: EAuthErrors.SLUG_INVALID })
  slug!: string;

  @ApiProperty({ example: 'segundo' })
  @IsNotEmpty({ message: EUsersErrors.USERNAME_INVALID })
  @IsString({ message: EUsersErrors.USERNAME_INVALID })
  username!: string;

  @ApiProperty({ example: '12345678' })
  @IsNotEmpty({ message: EUsersErrors.PASSWORD_INCORRECT })
  @IsString({ message: EUsersErrors.PASSWORD_INCORRECT })
  password!: string;
}
