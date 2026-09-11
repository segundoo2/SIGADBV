import { EntityManager } from 'typeorm';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ProductDto } from '../dtos/product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { Product } from '../entities/product.entity';

export interface IProductsService {
  createProduct(
    productDto: ProductDto & { tenantId: string },
  ): Promise<IResponse<null>>;

  updateProduct(
    updateProductDto: UpdateProductDto,
    id: string,
    tenantId: string,
  ): Promise<IResponse<null>>;

  applyStockDelta(
    productId: string,
    tenantId: string,
    delta: number,
    entityManager?: EntityManager,
  ): Promise<IResponse<{ newCurrentStock: number; uom: string }>>;

  findOneById(
    id: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<Product | null>;

  findOneBySku(sku: string, tenantId: string): Promise<IResponse<Product>>;

  findAllProducts(
    tenantId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Product[]>>;

  deleteProduct(sku: string, tenantId: string): Promise<IResponse<null>>;
}
