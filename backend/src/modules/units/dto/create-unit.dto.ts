import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';

export class CreateUnitDto {
  @ApiProperty({
    description: 'Nome da unidade de desbravadores',
    example: 'Unidade Alpha',
    maxLength: 150,
  })
  @IsString({ message: 'O nome da unidade deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O nome da unidade não pode estar vazio.' })
  @MaxLength(150, {
    message: 'O nome da unidade não pode ter mais de 150 caracteres.',
  })
  name!: string;

  @ApiProperty({
    description: 'Gênero/categoria da unidade',
    enum: EUnitGender,
    example: EUnitGender.MALE,
    default: EUnitGender.MALE,
  })
  @IsEnum(EUnitGender, {
    message: 'Informe um gênero de unidade válido (MALE, FEMALE ou MIXED ).',
  })
  @IsNotEmpty({ message: 'O gênero da unidade é obrigatório.' })
  gender!: EUnitGender;

  @ApiPropertyOptional({
    description: 'Número máximo de membros permitidos na unidade',
    example: 8,
    default: 8,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'O número máximo de membros deve ser um número inteiro.' })
  @Min(1, { message: 'A unidade deve permitir pelo menos 1 membro.' })
  maxMembers?: number;
}
