import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { IProductLocationsRepository } from './interfaces/product-locations.repository.interface';
import { ProductLocation } from './entities/product-location.entity';

@Injectable()
export class ProductLocationsRepository implements IProductLocationsRepository {
  constructor(private readonly dataSource: DataSource) {}

  private getRepository(em?: EntityManager): Repository<ProductLocation> {
    return em
      ? em.getRepository(ProductLocation)
      : this.dataSource.getRepository(ProductLocation);
  }

  async findByProductAndLocation(
    productId: string,
    locationId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<ProductLocation | null> {
    const repo = this.getRepository(em);
    return await repo.findOne({
      where: {
        productId,
        locationId,
        tenantId,
      },
    });
  }

  async countActiveProductsInLocation(
    locationId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepository(em);

    // Conta produtos distintos alocados na posição que tenham saldo maior que zero
    return await repo
      .createQueryBuilder('pl')
      .where('pl.location_id = :locationId', { locationId })
      .andWhere('pl.tenant_id = :tenantId', { tenantId })
      .andWhere('pl.quantity > 0')
      .getCount();
  }

  async sumAllocatedStock(
    productId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<number> {
    const repo = this.getRepository(em);

    const result = await repo
      .createQueryBuilder('pl')
      .select('SUM(pl.quantity)', 'total')
      .where('pl.product_id = :productId', { productId })
      .andWhere('pl.tenant_id = :tenantId', { tenantId })
      .getRawOne<{ total: string | null }>();

    return result?.total ? parseFloat(result.total) : 0;
  }

  async incrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    em?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepository(em);

    const existingRecord = await this.findByProductAndLocation(
      productId,
      locationId,
      tenantId,
      em,
    );

    if (existingRecord) {
      await repo.increment(
        { id: existingRecord.id, tenantId },
        'quantity',
        quantity,
      );
    } else {
      const newRecord = repo.create({
        productId,
        locationId,
        tenantId,
        quantity,
      });
      await repo.save(newRecord);
    }
  }

  async decrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    em?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepository(em);

    await repo.decrement(
      { productId, locationId, tenantId },
      'quantity',
      quantity,
    );
  }
}
