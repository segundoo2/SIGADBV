import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ProductDto } from './product.dto';

export class UpdateProductDto extends PartialType(ProductDto) {
  @ApiPropertyOptional({
    description: 'UUID da categoria associada ao produto',
    example: 'd3b07384-d113-4ec6-a5d6-c1c234567890',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}
