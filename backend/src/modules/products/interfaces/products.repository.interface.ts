import { DeleteResult, EntityManager, UpdateResult } from 'typeorm';
import { ProductDto } from '../dtos/product.dto';
import { Product } from '../entities/product.entity';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export interface IProductsRepository {
  createProduct(
    productDto: ProductDto & { tenantId: string },
  ): Promise<Product>;
  findOneCurrentStockById(
    id: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<Pick<Product, 'currentStock' | 'uom'> | null>;
  findOneById(
    id: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<Product | null>;
  findOneBySku(sku: string, tenantId: string): Promise<Product | null>;
  findAllProducts(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Product[], number]>;
  updateProduct(
    updateProductDto: UpdateProductDto,
    id: string,
    tenantId: string,
  ): Promise<UpdateResult>;
  updateStockAtomic(
    productId: string,
    tenantId: string,
    delta: number,
    manager?: EntityManager,
  ): Promise<UpdateResult>;
  deleteProduct(sku: string, tenantId: string): Promise<DeleteResult>;
}
