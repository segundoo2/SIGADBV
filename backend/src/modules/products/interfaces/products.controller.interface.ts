import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ProductDto } from '../dtos/product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { Product } from '../entities/product.entity';

export interface IProductsController {
  createProduct(
    productDto: ProductDto,
    tenantId: string,
  ): Promise<IResponse<null>>;
  updateProduct(
    updateProductDto: UpdateProductDto,
    id: string,
    tenantId: string,
  ): Promise<IResponse<null>>;
  findOneBySku(sku: string, tenantId: string): Promise<IResponse<Product>>;
  findAllProducts(
    tenantId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Product[]>>;
  deleteProduct(sku: string, tenantId: string): Promise<IResponse<null>>;
}
