import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AllocateLocationDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ description: 'ID da posição de destino' })
  @IsUUID()
  @IsNotEmpty()
  targetLocationId!: string;

  @ApiPropertyOptional({
    description: 'ID da posição de origem (se for transferência)',
  })
  @IsUUID()
  @IsOptional()
  sourceLocationId?: string;

  @ApiProperty({ description: 'Quantidade a ser movimentada' })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Motivo da movimentação' })
  @IsString()
  @IsOptional()
  reason?: string;
}
