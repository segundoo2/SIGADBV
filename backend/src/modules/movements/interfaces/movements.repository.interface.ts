import { EntityManager } from 'typeorm';
import { MovementDto } from '../dtos/movement.dto';
import { Movement } from '../entities/movement.entity';

export interface IMovementsRepository {
  registerMovement(
    movements: MovementDto & { tenantId: string },
    manager?: EntityManager,
  ): Promise<void>;

  findAllPaginatedByProduct(
    productId: string,
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ movements: Movement[]; total: number }>;
}
