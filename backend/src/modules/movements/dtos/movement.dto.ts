import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export enum EMovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
}

export class MovementDto {
  @ApiProperty({ enum: EMovementType, description: 'Tipo da movimentação' })
  @IsEnum(EMovementType)
  @IsNotEmpty()
  typeMovement!: EMovementType;

  @ApiProperty({ description: 'Quantidade movimentada', example: 10 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Motivo da movimentação' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'ID do produto (UUID v4)' })
  @IsUUID('4')
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ description: 'ID da localização (UUID v4)' })
  @IsUUID('4')
  @IsOptional()
  locationId?: string;
}
