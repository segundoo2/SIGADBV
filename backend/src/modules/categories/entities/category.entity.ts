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
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'categories' })
@Index(['tenantId', 'name'], { unique: true })
export class Category {
  @ApiProperty({
    description: 'Identificador único da categoria (UUID v4)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
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
    description: 'Nome da categoria',
    example: 'Eletrônicos',
  })
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @ApiPropertyOptional({
    description: 'Descrição da categoria',
    example: 'Dispositivos eletrônicos e acessórios',
    nullable: true,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @ApiProperty({
    description: 'Indica se a categoria está ativa',
    example: true,
  })
  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @ApiPropertyOptional({
    type: () => [Product],
    description: 'Lista de produtos pertencentes a esta categoria',
  })
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];

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
}
