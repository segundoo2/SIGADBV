import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../../categories/entities/category.entity';
import { ProductLocation } from '../../locations/entities/product-location.entity';

interface ValueTransformer {
  to(value: number): number;
  from(value: string): number;
}

const decimalTransformer: ValueTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

@Entity({ name: 'products' })
@Index(['tenantId', 'sku'], { unique: true })
export class Product {
  @ApiProperty({
    description: 'Identificador único do produto (UUID v4)',
    example: 'd3b07384-d113-424a-a1d2-06834d858348',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador do tenant proprietário',
    example: 'tenant-12345',
  })
  @Column({ type: 'varchar', name: 'tenant_id' })
  @Index()
  tenantId!: string;

  @ApiProperty({
    description: 'Código SKU (Stock Keeping Unit) do produto',
    example: 'CAM-ALGODAO-M',
  })
  @Column({ type: 'varchar', length: 50 })
  sku!: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Camiseta de Algodão M',
  })
  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @ApiProperty({
    description: 'Unidade de medida do produto',
    example: 'UN',
    default: 'UN',
  })
  @Column({ type: 'varchar', length: 10, default: 'UN' })
  uom!: string;

  @ApiProperty({
    description:
      'Quantidade em estoque total do produto (soma de todas as localizações)',
    example: 150.0,
    default: 0.0,
    type: Number,
  })
  @Column({
    type: 'decimal',
    name: 'current_stock',
    precision: 12,
    scale: 4,
    default: 0.0,
    transformer: decimalTransformer,
  })
  currentStock!: number;

  @ApiProperty({
    description: 'Estoque mínimo de alerta para reposição',
    example: 10.0,
    default: 0.0,
    type: Number,
  })
  @Column({
    type: 'decimal',
    name: 'minimum_stock',
    precision: 12,
    scale: 4,
    default: 0.0,
    transformer: decimalTransformer,
  })
  minimumStock!: number;

  @ApiProperty({
    description: 'Preço de venda do produto',
    example: 49.9,
    default: 0.0,
    type: Number,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  price!: number;

  @ApiProperty({
    description: 'Preço de custo do produto',
    example: 20.0,
    default: 0.0,
    type: Number,
  })
  @Column({
    type: 'decimal',
    name: 'cost_price',
    precision: 12,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  costPrice!: number;

  // --- RELACIONAMENTOS ---
  @ApiPropertyOptional({
    description: 'ID da categoria à qual o produto pertence',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    nullable: true,
  })
  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId?: string | null;

  @ApiPropertyOptional({
    type: () => Category,
    description: 'Categoria vinculada ao produto',
    nullable: true,
  })
  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @ApiPropertyOptional({
    type: () => [ProductLocation],
    description: 'Distribuição do produto nas localizações do estoque',
  })
  @OneToMany(
    () => ProductLocation,
    (productLocation) => productLocation.product,
    {
      cascade: true,
    },
  )
  locations?: ProductLocation[];

  // --- DADOS FISCAIS ---
  @ApiPropertyOptional({
    description: 'Código EAN / GTIN (Código de barras)',
    example: '7891234567890',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 14, nullable: true })
  ean?: string | null;

  @ApiPropertyOptional({
    description: 'Código NCM (Nomenclatura Comum do Mercosul)',
    example: '61091000',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 8, nullable: true })
  ncm?: string | null;

  @ApiPropertyOptional({
    description: 'Código CEST (Especificação da Substituição Tributária)',
    example: '2803800',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 7, nullable: true })
  cest?: string | null;

  @ApiProperty({
    description: 'Origem da mercadoria (0 - Nacional, 1 - Estrangeira, etc.)',
    example: '0',
    default: '0',
  })
  @Column({ type: 'varchar', length: 1, default: '0' })
  origin!: string;

  @ApiPropertyOptional({
    description: 'Código CSOSN (Simples Nacional)',
    example: '102',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 3, nullable: true })
  csosn?: string | null;

  @ApiPropertyOptional({
    description: 'Código CST (Regime Normal)',
    example: '00',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 2, nullable: true })
  cst?: string | null;

  // --- AUDITORIA ---
  @ApiPropertyOptional({
    description: 'Identificador do usuário que criou o registro',
    example: 'admin@empresa.com',
  })
  @Column({ type: 'varchar', name: 'created_by', length: 100, nullable: true })
  createdBy?: string;

  @ApiProperty({
    description: 'Data de criação do registro',
    example: '2026-07-27T20:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização do registro',
    example: '2026-07-27T20:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    description: 'Identificador do usuário que fez a última atualização',
    example: 'admin@empresa.com',
  })
  @Column({ type: 'varchar', name: 'updated_by', length: 100, nullable: true })
  updatedBy?: string;
}
