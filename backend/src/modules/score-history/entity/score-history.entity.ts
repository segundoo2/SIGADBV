import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UnitEntity } from '../../units/entities/unit.entity';

@Entity('score_history')
export class ScoreHistoryEntity {
  @ApiProperty({
    description: 'Identificador único do histórico de pontuação (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    description: 'Identificador do clube/inquilino (Multi-tenant)',
    example: 'd3b07384-d113-4ec6-a4f6-53856372d681',
  })
  @Column({
    name: 'tenant_id',
    type: 'uuid',
    nullable: false,
    default: '00000000-0000-0000-0000-000000000000',
  })
  @Index()
  tenantId!: string;

  @ApiProperty({
    description: 'Identificador único da unidade',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Column({ type: 'uuid', name: 'unit_id', nullable: false })
  @Index()
  unitId!: string;

  @ManyToOne(() => UnitEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'unit_id' })
  unit!: UnitEntity;

  @ApiProperty({
    description: 'Valor do ajuste de pontuação',
    example: 50,
  })
  @Column({ type: 'int', nullable: false })
  score!: number;

  @ApiProperty({
    description: 'Motivo ou descrição do ajuste de pontuação',
    example: 'Presença com uniforme completo',
    maxLength: 255,
  })
  @Column({ type: 'varchar', length: 255, nullable: false })
  description!: string;

  @ApiProperty({
    description: 'Data de criação do registo',
    example: '2026-09-18T22:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  readonly createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização do registo',
    example: '2026-09-18T22:00:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  readonly updatedAt!: Date;
}
