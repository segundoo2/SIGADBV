import {
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { EMovementType } from '../dtos/movement.dto';
import { Product } from '../../products/entities/product.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('stock_movements')
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'createdAt'])
export class Movement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: false })
  @Index()
  tenantId!: string;

  @Column({
    type: 'enum',
    enum: EMovementType,
    name: 'type_movement',
    nullable: false,
  })
  typeMovement!: EMovementType;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason?: string;

  @Column({ type: 'uuid', name: 'product_id', nullable: false })
  productId!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'uuid', name: 'location_id', nullable: true })
  locationId?: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId?: string;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt!: Date;
}
