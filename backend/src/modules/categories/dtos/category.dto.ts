import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';
import { ECategoryErrors } from '../../../common/enum/category-errors.enum';

export class CategoryDto implements Pick<
  Category,
  'name' | 'description' | 'isActive'
> {
  @ApiProperty({
    description: 'Nome único da categoria dentro do tenant',
    example: 'Eletrônicos',
    minLength: 2,
    maxLength: 50,
  })
  @IsString({ message: ECategoryErrors.NAME_STRING_REQUIRED })
  @IsNotEmpty({ message: ECategoryErrors.NAME_CATEGORY })
  @Length(2, 50, { message: ECategoryErrors.NAME_CATEGORY })
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada da categoria',
    example: 'Dispositivos eletrônicos e acessórios em geral',
    maxLength: 100,
    nullable: true,
  })
  @IsString({ message: ECategoryErrors.DESCRIPTION_STRING_REQUIRED })
  @IsOptional()
  @MaxLength(100, { message: ECategoryErrors.DESCRIPTION_CATEGORY })
  description?: string | null;

  @ApiProperty({
    description: 'Status de ativação da categoria',
    example: true,
    default: true,
  })
  @IsBoolean({ message: ECategoryErrors.BOOLEAN_REQUIRED })
  isActive!: boolean;
}
