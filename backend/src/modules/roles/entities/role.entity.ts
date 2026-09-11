import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'roles' })
@Unique('uq_role_tenant_name', ['tenantId', 'name'])
export class Role {
  @ApiProperty({ description: 'Identificador único da Role (UUID v4)' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ description: 'Identificador do tenant' })
  @Column('uuid')
  @Index()
  tenantId!: string;

  @ApiProperty({ description: 'Nome da Role', example: 'Gerente de Estoque' })
  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @ApiProperty({
    description: 'Array de permissões atreladas à role',
    example: ['users.create', 'products.create', 'products.read'],
  })
  @Column({ type: 'jsonb', default: [] })
  permissions!: string[];

  @ManyToMany(() => User, (user) => user.roles)
  users!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
