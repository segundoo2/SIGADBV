import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductLocation } from './product-location.entity';

interface ValueTransformer {
  to(value: number | null): number | null;
  from(value: string | null): number | null;
}

const decimalTransformer: ValueTransformer = {
  to: (value: number | null): number | null => value,
  from: (value: string | null): number | null =>
    value ? parseFloat(value) : null,
};

export enum ELocationType {
  DISPLAY = 'DISPLAY', // Mostruário / Gôndola / Área de Venda
  STORAGE = 'STORAGE', // Depósito / Almoxarifado / Estoque Principal
}

@Entity({ name: 'locations' })
@Index(['tenantId', 'code'], { unique: true })
export class Location {
  @ApiProperty({
    description: 'Identificador único da localização (UUID v4)',
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
    description: 'Código/Endereço físico da localização no estoque',
    example: 'CORREDOR-A-PRATELEIRA-02',
  })
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @ApiProperty({
    enum: ELocationType,
    description:
      'Tipo da localização (DISPLAY: Mostruário/Área de venda, STORAGE: Depósito/Estoque)',
    example: ELocationType.STORAGE,
    default: ELocationType.STORAGE,
  })
  @Column({
    type: 'enum',
    enum: ELocationType,
    default: ELocationType.STORAGE,
  })
  type!: ELocationType;

  @ApiPropertyOptional({
    description: 'Capacidade máxima suportada por esta posição (opcional)',
    example: 100.0,
    nullable: true,
    type: Number,
  })
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 4,
    nullable: true,
    transformer: decimalTransformer,
  })
  capacity?: number | null;

  @ApiPropertyOptional({
    description: 'Descrição opcional ou observações sobre a localização',
    example: 'Área refrigerada para produtos perecíveis',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @ApiPropertyOptional({
    type: () => [ProductLocation],
    description: 'Produtos e quantidades armazenadas nesta localização',
  })
  @OneToMany(
    () => ProductLocation,
    (productLocation) => productLocation.location,
  )
  productLocations?: ProductLocation[];

  @ApiProperty({
    description: 'Data de criação da localização',
    example: '2026-07-27T20:00:00.000Z',
  })
  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização da localização',
    example: '2026-07-27T20:00:00.000Z',
  })
  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt!: Date;
}
