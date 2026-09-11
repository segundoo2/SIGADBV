import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductDto } from './dtos/product.dto';
import { EErrorsGlobal } from '../../common/enum/errors-global.enum';
import { DeleteResult, EntityManager, Repository, UpdateResult } from 'typeorm';
import { UpdateProductDto } from './dtos/update-product.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';

@Injectable()
export class ProductsRepository implements ProductsRepository {
  constructor(
    @InjectRepository(Product) private readonly repository: Repository<Product>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<Product> {
    return manager ? manager.getRepository(Product) : this.repository;
  }

  async createProduct(
    productDto: ProductDto & { tenantId: string },
  ): Promise<Product> {
    try {
      const product = this.repository.create(productDto);
      return await this.repository.save(product);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findOneCurrentStockById(
    id: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<Pick<Product, 'currentStock' | 'uom'> | null> {
    const repo = this.getRepository(manager);

    return await repo.findOne({
      where: { id, tenantId },
      select: { currentStock: true, uom: true },
      lock: manager ? { mode: 'pessimistic_write' } : undefined,
    });
  }

  async findOneById(
    id: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<Product | null> {
    const repo = this.getRepository(manager);
    return await repo.findOne({
      where: { id, tenantId },
    });
  }

  async findOneBySku(sku: string, tenantId: string): Promise<Product | null> {
    try {
      return await this.repository.findOne({
        where: { sku, tenantId },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllProducts(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Product[], number]> {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 10;
      const skip = (page - 1) * limit;

      return await this.repository.findAndCount({
        where: { tenantId },
        skip,
        take: limit,
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async updateProduct(
    updateProductDto: UpdateProductDto,
    id: string,
    tenantId: string,
  ): Promise<UpdateResult> {
    try {
      return await this.repository.update(
        {
          id,
          tenantId,
        },
        updateProductDto,
      );
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async updateStockAtomic(
    productId: string,
    tenantId: string,
    delta: number,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    const repo = this.getRepository(manager);

    const query = repo
      .createQueryBuilder('product')
      .update(Product)
      .set({
        currentStock: () => `current_stock + ${delta}`,
      })
      .where('id = :productId AND tenant_id = :tenantId', {
        productId,
        tenantId,
      });

    if (delta < 0) {
      query.andWhere('current_stock + :delta >= 0', { delta });
    }

    return await query.returning(['current_stock', 'uom']).execute();
  }

  async deleteProduct(sku: string, tenantId: string): Promise<DeleteResult> {
    try {
      return await this.repository.delete({ sku, tenantId });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
