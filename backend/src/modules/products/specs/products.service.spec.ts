/* eslint-disable @typescript-eslint/unbound-method */
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ProductDto } from '../dtos/product.dto';
import { Product } from '../entities/product.entity';
import { EProductsSuccess } from '../../../common/enum/products-success.enum';
import { EProductsErrors } from '../../../common/enum/products-errors.enum';
import { IProductsRepository } from '../interfaces/products.repository.interface';
import { IProductsService } from '../interfaces/products.service.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ProductsService } from '../products.service';
import { DeleteResult, UpdateResult } from 'typeorm';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

describe('ProductsService', () => {
  let service: IProductsService;
  let mockRepository: jest.Mocked<IProductsRepository>;

  const mockProductDto: ProductDto = {
    sku: 'PROD-ALFA-001',
    name: 'Refrigerante Cola 350ml',
    uom: 'UN',
    minimumStock: 10.0,
    price: 5.5,
    costPrice: 2.8,
    ean: '7891234567890',
    ncm: '22021000',
    cest: '0300700',
    origin: '0',
    csosn: '102',
    cst: null,
  };

  const mockProduct: Product = {
    id: 'a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890',
    tenantId: 'tenant-123-xyz',
    sku: mockProductDto.sku,
    name: mockProductDto.name,
    uom: mockProductDto.uom,
    currentStock: 0.0,
    minimumStock: mockProductDto.minimumStock,
    price: mockProductDto.price,
    costPrice: mockProductDto.costPrice,

    // --- RELACIONAMENTOS ---
    categoryId: null,
    category: null,
    locations: [],

    // --- DADOS FISCAIS ---
    ean: mockProductDto.ean,
    ncm: mockProductDto.ncm,
    cest: mockProductDto.cest,
    origin: mockProductDto.origin,
    csosn: mockProductDto.csosn,
    cst: mockProductDto.cst,

    // --- TIMESTAMPS & AUDITORIA ---
    createdBy: 'user-admin-123',
    updatedBy: 'user-admin-123',
    createdAt: new Date('2026-07-15T19:00:00Z'),
    updatedAt: new Date('2026-07-15T19:00:00Z'),
  };

  beforeEach(() => {
    mockRepository = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      updateStockAtomic: jest.fn(),
      findOneCurrentStockById: jest.fn(),
      findOneBySku: jest.fn(),
      findAllProducts: jest.fn(),
      deleteProduct: jest.fn(),
    };

    service = new ProductsService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    const productDto = {
      ...mockProductDto,
      tenantId: mockProduct.tenantId,
    };
    const response: IResponse<null> = {
      message: EProductsSuccess.CREATE,
      data: null,
    };

    it('should return product when it is create', async () => {
      mockRepository.findOneBySku.mockResolvedValue(null);
      mockRepository.createProduct.mockResolvedValue(mockProduct);

      expect(await service.createProduct(productDto)).toEqual(response);
      expect(mockRepository.findOneBySku).toHaveBeenCalledWith(
        mockProductDto.sku,
        mockProduct.tenantId,
      );
      expect(mockRepository.createProduct).toHaveBeenCalledWith(productDto);
    });

    it('should throw ConflictException when the product SKU already exists', async () => {
      mockRepository.createProduct.mockRejectedValue(
        new ConflictException(EProductsErrors.PRODUCT_EXIST),
      );
      await expect(service.createProduct(productDto)).rejects.toThrow(
        new ConflictException(EProductsErrors.PRODUCT_EXIST),
      );
      expect(mockRepository.createProduct).toHaveBeenCalledWith(productDto);
    });
  });

  describe('updateProduct', () => {
    const mockUpdateProductDto: UpdateProductDto = {
      ...mockProductDto,
      categoryId: 'uuid-1',
    };

    const responseRepository: UpdateResult = {
      raw: [],
      affected: 1,
      generatedMaps: [],
    };
    const response: IResponse<null> = {
      message: EProductsSuccess.UPDATE,
      data: null,
    };

    it(`should return the message ${EProductsSuccess.UPDATE} when product is update success`, async () => {
      mockRepository.updateProduct.mockResolvedValue(responseRepository);
      expect(
        await service.updateProduct(
          mockUpdateProductDto,
          mockProduct.id,
          mockProduct.tenantId,
        ),
      ).toEqual(response);
    });

    it('should return NotFoundException when the property affected === 0', async () => {
      responseRepository.affected = 0;
      mockRepository.updateProduct.mockResolvedValue(responseRepository);
      await expect(
        service.updateProduct(
          mockUpdateProductDto,
          mockProduct.id,
          mockProduct.tenantId,
        ),
      ).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
    });
  });

  describe('applyStockDelta', () => {
    const initialStock = 10;
    const uom = 'UN';

    it('should return success object with newCurrentStock and uom when currentStock increment succeeds', async () => {
      const delta = 3;
      const expectedStock = initialStock + delta;

      const responseUpdated: UpdateResult = {
        raw: [{ current_stock: expectedStock, uom }],
        affected: 1,
        generatedMaps: [],
      };

      mockRepository.updateStockAtomic.mockResolvedValue(responseUpdated);

      const result = await service.applyStockDelta(
        mockProduct.id,
        mockProduct.tenantId,
        delta,
      );

      expect(result).toEqual({
        message: EProductsSuccess.INPUT_MOVIMENT,
        data: { newCurrentStock: expectedStock, uom },
      });
      expect(mockRepository.updateStockAtomic).toHaveBeenCalledWith(
        mockProduct.id,
        mockProduct.tenantId,
        delta,
        undefined,
      );
    });

    it('should return success object with newCurrentStock and uom when currentStock decrement succeeds', async () => {
      const delta = -3;
      const expectedStock = initialStock + delta;

      const responseUpdated: UpdateResult = {
        raw: [{ current_stock: expectedStock, uom }],
        affected: 1,
        generatedMaps: [],
      };

      mockRepository.updateStockAtomic.mockResolvedValue(responseUpdated);

      const result = await service.applyStockDelta(
        mockProduct.id,
        mockProduct.tenantId,
        delta,
      );

      expect(result).toEqual({
        message: EProductsSuccess.OUTPUT_MOVIMENT,
        data: { newCurrentStock: expectedStock, uom },
      });
    });

    it('should return BadRequestException when updateStockAtomic affects 0 rows but product exists (insufficient stock)', async () => {
      const delta = -15;

      const failedUpdateResult: UpdateResult = {
        raw: [],
        affected: 0,
        generatedMaps: [],
      };

      mockRepository.updateStockAtomic.mockResolvedValue(failedUpdateResult);
      mockRepository.findOneCurrentStockById.mockResolvedValue({
        currentStock: initialStock,
        uom,
      });

      await expect(
        service.applyStockDelta(mockProduct.id, mockProduct.tenantId, delta),
      ).rejects.toThrow(
        new BadRequestException(
          `${EProductsErrors.PRODUCT_QUANTITY_INVALID} ${initialStock} ${uom}`,
        ),
      );

      expect(mockRepository.findOneCurrentStockById).toHaveBeenCalledWith(
        mockProduct.id,
        mockProduct.tenantId,
        undefined,
      );
    });

    it('should return NotFoundException when updateStockAtomic affects 0 rows and product is not found', async () => {
      const delta = 5;

      const failedUpdateResult: UpdateResult = {
        raw: [],
        affected: 0,
        generatedMaps: [],
      };

      mockRepository.updateStockAtomic.mockResolvedValue(failedUpdateResult);
      mockRepository.findOneCurrentStockById.mockResolvedValue(null);

      await expect(
        service.applyStockDelta(mockProduct.id, mockProduct.tenantId, delta),
      ).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
    });
  });

  describe('findOneBySku', () => {
    it('should return product entity when it exists', async () => {
      mockRepository.findOneBySku.mockResolvedValue(mockProduct);

      expect(
        await service.findOneBySku(mockProduct.sku, mockProduct.tenantId),
      ).toEqual({
        message: EProductsSuccess.FIND_ONE,
        data: mockProduct,
      });
      expect(mockRepository.findOneBySku).toHaveBeenCalledWith(
        mockProduct.sku,
        mockProduct.tenantId,
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      mockRepository.findOneBySku.mockResolvedValue(null);

      await expect(
        service.findOneBySku(mockProductDto.sku, mockProduct.tenantId),
      ).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
      expect(mockRepository.findOneBySku).toHaveBeenCalledWith(
        mockProductDto.sku,
        mockProduct.tenantId,
      );
    });
  });

  describe('findAllProducts', () => {
    const pagination: PaginationQueryDto = { page: 1, limit: 10 };

    it('should return paginated list when products are found', async () => {
      const mockList: Product[] = [mockProduct, mockProduct, mockProduct];
      const response: IPaginatedResponse<Product[]> = {
        message: EProductsSuccess.FIND_ALL,
        data: mockList,
        meta: {
          itemCount: 3,
          totalItems: 3,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      mockRepository.findAllProducts.mockResolvedValue([mockList, 3]);

      expect(
        await service.findAllProducts(mockProduct.tenantId, pagination),
      ).toEqual(response);
      expect(mockRepository.findAllProducts).toHaveBeenCalledWith(
        mockProduct.tenantId,
        pagination,
      );
    });

    it('should return NotFoundException when no products are found', async () => {
      mockRepository.findAllProducts.mockResolvedValue([[], 0]);
      await expect(
        service.findAllProducts(mockProduct.tenantId, pagination),
      ).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
      expect(mockRepository.findAllProducts).toHaveBeenCalledWith(
        mockProduct.tenantId,
        pagination,
      );
    });
  });

  describe('deleteProduct', () => {
    const response: IResponse<null> = {
      message: EProductsSuccess.DELETE,
      data: null,
    };
    const responseRepository: DeleteResult = {
      raw: [],
      affected: 1,
    };

    it('should return a success message when the product is delete success', async () => {
      mockRepository.deleteProduct.mockResolvedValue(responseRepository);
      expect(
        await service.deleteProduct(mockProduct.sku, mockProduct.tenantId),
      ).toEqual(response);
      expect(mockRepository.deleteProduct).toHaveBeenCalledWith(
        mockProduct.sku,
        mockProduct.tenantId,
      );
    });

    it('should return NotFoundException when the product not found', async () => {
      responseRepository.affected = 0;
      mockRepository.deleteProduct.mockResolvedValue(responseRepository);
      await expect(
        service.deleteProduct(mockProduct.sku, mockProduct.tenantId),
      ).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
    });
  });
});
