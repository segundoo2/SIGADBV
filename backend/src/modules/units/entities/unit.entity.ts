import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { ScoreHistoryEntity } from '../../score-history/entity/score-history.entity';

@Entity('units')
@Index(['tenantId', 'name'], { unique: true })
export class UnitEntity {
  @ApiProperty({
    description: 'Identificador único da unidade (UUID)',
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
    description: 'Nome da unidade de desbravadores',
    example: 'Unidade Alpha',
    maxLength: 150,
  })
  @Column({ type: 'varchar', length: 150, nullable: false })
  name!: string;

  @ApiProperty({
    description: 'Gênero da unidade',
    enum: EUnitGender,
    example: EUnitGender.MALE,
    default: EUnitGender.MALE,
  })
  @Column({
    type: 'enum',
    enum: EUnitGender,
    nullable: false,
    default: EUnitGender.MALE,
  })
  gender!: EUnitGender;

  @ApiProperty({
    description: 'Número máximo de membros permitidos na unidade',
    example: 8,
    default: 8,
  })
  @Column({ name: 'max_members', type: 'integer', nullable: false, default: 8 })
  maxMembers!: number;

  @ApiProperty({
    description: 'Pontuação total acumulada pela unidade',
    example: 150,
    default: 0,
  })
  @Column({
    name: 'score',
    type: 'integer',
    nullable: false,
    default: 0,
  })
  score!: number;

  @ApiPropertyOptional({
    description: 'Histórico de ajustes de pontuação da unidade',
    type: () => [ScoreHistoryEntity],
  })
  @OneToMany(() => ScoreHistoryEntity, (history) => history.unit, {
    cascade: true,
  })
  scoreHistories!: ScoreHistoryEntity[];

  // Descomentar quando members for implementado e mapear o DTO/Entity correspondente
  // @ApiPropertyOptional({ description: 'Lista de membros associados à unidade', type: () => [MemberEntity] })
  // @OneToMany(() => MemberEntity, (member) => member.unit, { cascade: true })
  // members!: unknown[];

  @ApiProperty({
    description: 'Data de criação do registo',
    example: '2026-09-18T22:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt!: Date;

  @ApiProperty({
    description: 'Data da última atualização do registo',
    example: '2026-09-18T22:00:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt!: Date;
}
