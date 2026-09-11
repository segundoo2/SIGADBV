import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IProductsRepository } from './interfaces/products.repository.interface';
import { IProductsService } from './interfaces/products.service.interface';
import { ProductDto } from './dtos/product.dto';
import { EProductsSuccess } from '../../common/enum/products-success.enum';
import { Product } from './entities/product.entity';
import { IResponse } from '../../common/interfaces/response.interface';
import { EProductsErrors } from '../../common/enum/products-errors.enum';
import { DeleteResult, EntityManager } from 'typeorm';
import { UpdateProductDto } from './dtos/update-product.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { IRawStockRow } from './interfaces/raw-stock-row.interface';

@Injectable()
export class ProductsService implements IProductsService {
  constructor(
    @Inject('IProductsRepository')
    private readonly productsRepository: IProductsRepository,
  ) {}

  async createProduct(
    productDto: ProductDto & { tenantId: string },
  ): Promise<IResponse<null>> {
    const existedProduct = await this.productsRepository.findOneBySku(
      productDto.sku,
      productDto.tenantId,
    );

    if (existedProduct) {
      throw new ConflictException(EProductsErrors.PRODUCT_EXIST);
    }

    await this.productsRepository.createProduct(productDto);
    return {
      message: EProductsSuccess.CREATE,
      data: null,
    };
  }

  async findOneById(
    id: string,
    tenantId: string,
    manager?: EntityManager,
  ): Promise<Product | null> {
    return await this.productsRepository.findOneById(id, tenantId, manager);
  }

  async findOneBySku(
    sku: string,
    tenantId: string,
  ): Promise<IResponse<Product>> {
    const product = await this.productsRepository.findOneBySku(sku, tenantId);

    if (!product) {
      throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
    }
    return {
      message: EProductsSuccess.FIND_ONE,
      data: product,
    };
  }

  async findAllProducts(
    tenantId: string,
    paginationQuery: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Product[]>> {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;

    const [products, totalItems] =
      await this.productsRepository.findAllProducts(tenantId, {
        page,
        limit,
      });

    if (products.length === 0) {
      throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
    }

    const totalPages = Math.ceil(totalItems / limit);

    return {
      message: EProductsSuccess.FIND_ALL,
      data: products,
      meta: {
        itemCount: products.length,
        totalItems,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async updateProduct(
    updateProductDto: UpdateProductDto,
    id: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    const productUpdated = await this.productsRepository.updateProduct(
      updateProductDto,
      id,
      tenantId,
    );

    if (productUpdated.affected === 0) {
      throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
    }

    return {
      message: EProductsSuccess.UPDATE,
      data: null,
    };
  }

  async applyStockDelta(
    productId: string,
    tenantId: string,
    delta: number,
    entityManager?: EntityManager,
  ): Promise<IResponse<{ newCurrentStock: number; uom: string }>> {
    const updateResult = await this.productsRepository.updateStockAtomic(
      productId,
      tenantId,
      delta,
      entityManager,
    );

    if (!updateResult.affected || updateResult.affected === 0) {
      const existingProduct =
        await this.productsRepository.findOneCurrentStockById(
          productId,
          tenantId,
          entityManager,
        );

      if (!existingProduct) {
        throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
      }

      const availableStock = Number(existingProduct.currentStock);
      throw new BadRequestException(
        `${EProductsErrors.PRODUCT_QUANTITY_INVALID} ${availableStock} ${existingProduct.uom}`,
      );
    }

    const rawRows = updateResult.raw as IRawStockRow[];
    const updatedRow = rawRows[0];
    const newCurrentStock = Number(updatedRow.current_stock);
    const uom = updatedRow.uom;

    return {
      message:
        delta > 0
          ? EProductsSuccess.INPUT_MOVIMENT
          : EProductsSuccess.OUTPUT_MOVIMENT,
      data: { newCurrentStock, uom },
    };
  }

  async deleteProduct(sku: string, tenantId: string): Promise<IResponse<null>> {
    const deletedProduct: DeleteResult =
      await this.productsRepository.deleteProduct(sku, tenantId);

    if (deletedProduct.affected === 0) {
      throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
    }

    return { message: EProductsSuccess.DELETE, data: null };
  }
}
