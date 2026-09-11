/* eslint-disable @typescript-eslint/unbound-method */
import { IResponse } from '../../../common/interfaces/response.interface';
import { ProductDto } from '../dtos/product.dto';
import { Product } from '../entities/product.entity';
import { EProductsSuccess } from '../../../common/enum/products-success.enum';
import { IProductsController } from '../interfaces/products.controller.interface';
import { IProductsService } from '../interfaces/products.service.interface';
import { ProductsController } from '../products.controller';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

describe('ProductsController', () => {
  let controller: IProductsController;
  let mockService: jest.Mocked<IProductsService>;

  beforeEach(() => {
    mockService = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      applyStockDelta: jest.fn(),
      findOneBySku: jest.fn(),
      findAllProducts: jest.fn(),
      deleteProduct: jest.fn(),
    };
    controller = new ProductsController(mockService);
  });

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

  describe('createProduct', () => {
    const response: IResponse<null> = {
      message: EProductsSuccess.CREATE,
      data: null,
    };
    it('should return product when it is create', async () => {
      mockService.createProduct.mockResolvedValue(response);
      expect(
        await controller.createProduct(mockProductDto, mockProduct.tenantId),
      ).toEqual(response);
      expect(mockService.createProduct).toHaveBeenCalledWith({
        ...mockProductDto,
        tenantId: mockProduct.tenantId,
      });
    });
  });

  describe('updateProduct', () => {
    const mockUpdateProductDto: UpdateProductDto = {
      ...mockProductDto,
      categoryId: 'uuid-1',
    };

    const response: IResponse<null> = {
      message: EProductsSuccess.UPDATE,
      data: null,
    };

    it(`should return the message ${EProductsSuccess.UPDATE} when product is update success`, async () => {
      mockService.updateProduct.mockResolvedValue(response);
      expect(
        await controller.updateProduct(
          mockUpdateProductDto,
          mockProduct.id,
          mockProduct.tenantId,
        ),
      ).toEqual(response);
    });
  });

  describe('findOneBySku', () => {
    const response: IResponse<Product> = {
      message: EProductsSuccess.CREATE,
      data: mockProduct,
    };
    it('should return a product when it is found', async () => {
      mockService.findOneBySku.mockResolvedValue(response);
      expect(
        await controller.findOneBySku(mockProduct.sku, mockProduct.tenantId),
      ).toEqual(response);
      expect(mockService.findOneBySku).toHaveBeenCalledWith(
        mockProduct.sku,
        mockProduct.tenantId,
      );
    });
  });

  describe('findAllProducts', () => {
    it('should return paginated products when it is found', async () => {
      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
      const response: IPaginatedResponse<Product | Product[]> = {
        message: EProductsSuccess.FIND_ALL,
        data: [mockProduct, mockProduct, mockProduct],
        meta: {
          itemCount: 3,
          totalItems: 3,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };
      mockService.findAllProducts.mockResolvedValue(
        response as IPaginatedResponse<Product[]>,
      );
      expect(
        await controller.findAllProducts(mockProduct.tenantId, paginationQuery),
      ).toEqual(response);
      expect(mockService.findAllProducts).toHaveBeenCalledWith(
        mockProduct.tenantId,
        paginationQuery,
      );
    });
  });

  describe('deleteProduct', () => {
    const response: IResponse<null> = {
      message: EProductsSuccess.DELETE,
      data: null,
    };

    it('should return a success message when the product is delete success', async () => {
      mockService.deleteProduct.mockResolvedValue(response);
      expect(
        await controller.deleteProduct(mockProduct.sku, mockProduct.tenantId),
      ).toEqual(response);
      expect(mockService.deleteProduct).toHaveBeenCalledWith(
        mockProduct.sku,
        mockProduct.tenantId,
      );
    });
  });
});
