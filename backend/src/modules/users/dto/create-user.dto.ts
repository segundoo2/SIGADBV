import { IsString, IsNotEmpty, Length } from 'class-validator';
import { EErrors } from '../../../enums/errors.enum';

export class CreateUserDto {
  @IsString({ message: EErrors.NAME_MUST_BE_STRING })
  @IsNotEmpty({ message: EErrors.NAME_CANNOT_BE_EMPTY })
  @Length(2, 255, {
    message: EErrors.NAME_LENGTH_INVALID,
  })
  name!: string;

  @IsString({ message: EErrors.SURNAME_MUST_BE_STRING })
  @IsNotEmpty({ message: EErrors.SURNAME_CANNOT_BE_EMPTY })
  @Length(2, 255, {
    message: EErrors.SURNAME_LENGTH_INVALID,
  })
  surname!: string;

  @IsString({ message: EErrors.USERNAME_MUST_BE_STRING })
  @IsNotEmpty({ message: EErrors.USERNAME_CANNOT_BE_EMPTY })
  @Length(4, 50, {
    message: EErrors.USERNAME_LENGTH_INVALID,
  })
  username!: string;

  @IsString({ message: EErrors.ROLE_MUST_BE_STRING })
  @IsNotEmpty({ message: EErrors.ROLE_CANNOT_BE_EMPTY })
  @Length(2, 20, {
    message: EErrors.ROLE_LENGTH_INVALID,
  })
  role!: string;

  @IsString({ message: EErrors.PASSWORD_MUST_BE_STRING })
  @IsNotEmpty({ message: EErrors.PASSWORD_CANNOT_BE_EMPTY })
  @Length(8, 20, {
    message: EErrors.PASSWORD_LENGTH_INVALID,
  })
  password?: string;
}
