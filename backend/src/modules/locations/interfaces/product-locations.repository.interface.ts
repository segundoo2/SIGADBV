import { EntityManager } from 'typeorm';
import { ProductLocation } from '../entities/product-location.entity';

export interface IProductLocationsRepository {
  findByProductAndLocation(
    productId: string,
    locationId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<ProductLocation | null>;

  countActiveProductsInLocation(
    locationId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<number>;

  sumAllocatedStock(
    productId: string,
    tenantId: string,
    entityManager?: EntityManager,
  ): Promise<number>;

  incrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    entityManager?: EntityManager,
  ): Promise<void>;

  decrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    entityManager?: EntityManager,
  ): Promise<void>;
}
