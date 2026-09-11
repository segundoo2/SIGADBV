import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Product } from '../entities/product.entity';

type CreateProductInput = Omit<
  Product,
  | 'id'
  | 'currentStock'
  | 'locations'
  | 'categoryId'
  | 'category'
  | 'tenantId'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
>;

export class ProductDto implements CreateProductInput {
  @ApiProperty({
    description: 'Código SKU único do produto',
    example: 'PROD-ALFA-001',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 50)
  sku!: string;

  @ApiProperty({
    description: 'Nome comercial do produto',
    example: 'Refrigerante Cola 350ml',
    minLength: 3,
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 150)
  name!: string;

  @ApiProperty({
    description: 'Preço de venda do produto',
    example: 5.5,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiProperty({
    description: 'Preço de custo do produto',
    example: 2.8,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice!: number;

  @ApiProperty({
    description: 'Estoque mínimo de segurança',
    example: 10.0,
    minimum: 0,
  })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  minimumStock!: number;

  @ApiPropertyOptional({
    description: 'Unidade de Medida (UOM)',
    example: 'UN',
    default: 'UN',
    minLength: 1,
    maxLength: 10,
  })
  @IsString()
  @IsOptional()
  @Length(1, 10)
  uom!: string;

  // --- DADOS FISCAIS ---
  @ApiPropertyOptional({
    description: 'Código de barras EAN/GTIN (EAN-8 a EAN-14)',
    example: '7891234567890',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Length(8, 14)
  ean?: string | null;

  @ApiPropertyOptional({
    description: 'Nomenclatura Comum do Mercosul (NCM)',
    example: '22021000',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Length(8, 8)
  ncm?: string | null;

  @ApiPropertyOptional({
    description: 'Especificação da Substituição Tributária (CEST)',
    example: '0300700',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Length(7, 7)
  cest?: string | null;

  @ApiPropertyOptional({
    description: 'Origem da mercadoria (Ex: 0 para Nacional)',
    example: '0',
    default: '0',
  })
  @IsString()
  @IsOptional()
  @Length(1, 1)
  origin!: string;

  @ApiPropertyOptional({
    description: 'Código de Situação da Operação no Simples Nacional (CSOSN)',
    example: '102',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  csosn?: string | null;

  @ApiPropertyOptional({
    description: 'Código de Situação Tributária (CST)',
    example: null,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Length(2, 2)
  cst?: string | null;
}
