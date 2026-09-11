import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../../products/entities/product.entity';
import { Location } from './location.entity';

interface ValueTransformer {
  to(value: number): number;
  from(value: string): number;
}

const decimalTransformer: ValueTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => parseFloat(value),
};

@Entity({ name: 'product_locations' })
@Index(['tenantId', 'productId', 'locationId'], { unique: true })
export class ProductLocation {
  @ApiProperty({
    description: 'Identificador único do vínculo (UUID v4)',
    example: 'f21a48c9-598d-4a14-8789-08226edb3b0d',
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
    description: 'ID do produto vinculado',
    example: 'd3b07384-d113-424a-a1d2-06834d858348',
  })
  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  @ApiPropertyOptional({
    type: () => Product,
    description: 'Produto vinculado',
  })
  @ManyToOne(() => Product, (product) => product.locations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @ApiProperty({
    description: 'ID da localização vinculada',
    example: 'f21a48c9-598d-4a14-8789-08226edb3b0d',
  })
  @Column({ type: 'uuid', name: 'location_id' })
  locationId!: string;

  @ApiPropertyOptional({
    type: () => Location,
    description: 'Localização vinculada',
  })
  @ManyToOne(() => Location, (location) => location.productLocations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @ApiProperty({
    description:
      'Quantidade estocada deste produto nesta localização específica',
    example: 50.0,
    default: 0.0,
    type: Number,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    default: 0.0,
    transformer: decimalTransformer,
  })
  quantity!: number;

  @ApiProperty({
    description: 'Data de vínculo do produto à localização',
    example: '2026-07-27T20:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização de quantidade',
    example: '2026-07-27T20:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
