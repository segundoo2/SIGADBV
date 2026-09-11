import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Movement } from './entities/movement.entity';
import { MovementDto } from './dtos/movement.dto';
import { IMovementsRepository } from './interfaces/movements.repository.interface';
import { EErrorsGlobal } from '../../common/enum/errors-global.enum';

@Injectable()
export class MovementsRepository implements IMovementsRepository {
  constructor(
    @InjectRepository(Movement)
    private readonly repository: Repository<Movement>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<Movement> {
    return manager ? manager.getRepository(Movement) : this.repository;
  }

  async registerMovement(
    movements: MovementDto & { tenantId: string },
    manager?: EntityManager,
  ): Promise<void> {
    try {
      const repo = this.getRepository(manager);
      const movement = repo.create(movements);
      await repo.save(movement);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllPaginatedByProduct(
    productId: string,
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ movements: Movement[]; total: number }> {
    try {
      const [movements, total] = await this.repository.findAndCount({
        where: { productId, tenantId },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: { location: true },
      });

      return { movements, total };
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
