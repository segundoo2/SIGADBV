import { DeleteResult, ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import { UsersRepository } from '../../users/users.repository';
import { Product } from '../entities/product.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsRepository } from '../products.repository';
import { ProductDto } from '../dtos/product.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ProductsRepository', () => {
  let productsRepository: ProductsRepository;
  let ormRepositoryMock: MockRepository<Product>;

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

  const createQueryBuilderMock = {
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const mockFactory = (): MockRepository<Product> & {
      createQueryBuilder: jest.Mock;
    } => ({
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        {
          provide: UsersRepository,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useFactory: mockFactory,
        },
      ],
    }).compile();

    productsRepository = module.get<ProductsRepository>(ProductsRepository);
    ormRepositoryMock = module.get<MockRepository<Product>>(
      getRepositoryToken(Product),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const shouldHandleDatabaseErrors = (
    operation: () => Promise<unknown>,
    mockMethod: () => jest.Mock | undefined,
  ): void => {
    it('should return InternalServerException when TypeORM throws an error', async () => {
      mockMethod()?.mockRejectedValue(
        new Error('[TypeOrmModule] Unable to connect to the database'),
      );

      await expect(operation()).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  };

  describe('createProduct', () => {
    const productDto = {
      ...mockProductDto,
      tenantId: mockProduct.tenantId,
    };

    it('should return the created product when it is persist success', async () => {
      ormRepositoryMock.create?.mockReturnValue(mockProduct);
      ormRepositoryMock.save?.mockResolvedValue(mockProduct);

      const result = await productsRepository.createProduct(productDto);

      expect(result).toEqual(mockProduct);
      expect(ormRepositoryMock.create).toHaveBeenCalledWith(productDto);
      expect(ormRepositoryMock.save).toHaveBeenCalledWith(mockProduct);
    });

    shouldHandleDatabaseErrors(
      async (): Promise<Product> =>
        productsRepository.createProduct(productDto),
      () => ormRepositoryMock.save,
    );
  });

  describe('findOneCurrentStockById', () => {
    const response: Pick<Product, 'currentStock' | 'uom'> = {
      currentStock: mockProduct.currentStock,
      uom: mockProduct.uom,
    };

    it('should return the currentStock when the product found', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(response);

      const result = await productsRepository.findOneCurrentStockById(
        mockProduct.id,
        mockProduct.tenantId,
      );

      expect(result).toEqual(response);
    });

    it('should return null when the product not found', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(null);

      const result = await productsRepository.findOneCurrentStockById(
        mockProduct.id,
        mockProduct.tenantId,
      );

      expect(result).toBeNull();
    });

    shouldHandleDatabaseErrors(
      async (): Promise<Pick<Product, 'currentStock' | 'uom'> | null> =>
        productsRepository.findOneCurrentStockById(
          mockProduct.id,
          mockProduct.tenantId,
        ),
      () => ormRepositoryMock.findOne,
    );
  });

  describe('findOneById', () => {
    it('should return product when it is found', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(mockProduct);

      const result = await productsRepository.findOneById(
        mockProduct.id,
        mockProduct.tenantId,
      );

      expect(result).toEqual(mockProduct);
    });

    shouldHandleDatabaseErrors(
      async (): Promise<Product | null> =>
        productsRepository.findOneById(mockProduct.id, mockProduct.tenantId),
      () => ormRepositoryMock.findOne,
    );
  });

  describe('findOneBySku', () => {
    it('should return product when it is found', async () => {
      ormRepositoryMock.findOne?.mockResolvedValue(mockProduct);

      const result = await productsRepository.findOneBySku(
        mockProduct.sku,
        mockProduct.tenantId,
      );

      expect(result).toEqual(mockProduct);
      expect(ormRepositoryMock.findOne).toHaveBeenCalledWith({
        where: {
          sku: mockProduct.sku,
          tenantId: mockProduct.tenantId,
        },
      });
    });

    shouldHandleDatabaseErrors(
      async (): Promise<Product | null> =>
        productsRepository.findOneBySku(mockProduct.sku, mockProduct.tenantId),
      () => ormRepositoryMock.findOne,
    );
  });

  describe('findAllProducts', () => {
    const pagination: PaginationQueryDto = { page: 1, limit: 10 };

    it("should return tuple [Product[], number] when it's found", async () => {
      const productsList: [Product[], number] = [
        [mockProduct, mockProduct, mockProduct],
        3,
      ];
      ormRepositoryMock.findAndCount?.mockResolvedValue(productsList);

      const result = await productsRepository.findAllProducts(
        mockProduct.tenantId,
        pagination,
      );

      expect(result).toEqual(productsList);
      expect(ormRepositoryMock.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: mockProduct.tenantId },
        skip: 0,
        take: 10,
      });
    });

    shouldHandleDatabaseErrors(
      async (): Promise<[Product[], number]> =>
        productsRepository.findAllProducts(mockProduct.tenantId, pagination),
      () => ormRepositoryMock.findAndCount,
    );
  });

  describe('updateProduct', () => {
    const mockUpdateProductDto: UpdateProductDto = {
      ...mockProductDto,
      categoryId: 'uuid-1',
    };
    const response: UpdateResult = {
      raw: [],
      affected: 1,
      generatedMaps: [],
    };

    it('should return the update result when update success', async () => {
      ormRepositoryMock.update?.mockResolvedValue(response);

      const result = await productsRepository.updateProduct(
        mockUpdateProductDto,
        mockProduct.id,
        mockProduct.tenantId,
      );

      expect(result).toEqual(response);
    });

    shouldHandleDatabaseErrors(
      async (): Promise<UpdateResult> =>
        productsRepository.updateProduct(
          mockUpdateProductDto,
          mockProduct.id,
          mockProduct.tenantId,
        ),
      () => ormRepositoryMock.update,
    );
  });

  describe('updateStockAtomic', () => {
    const response: UpdateResult = {
      raw: [{ current_stock: 15, uom: 'UN' }],
      affected: 1,
      generatedMaps: [],
    };

    it('should execute atomic update query successfully', async () => {
      createQueryBuilderMock.execute.mockResolvedValue(response);

      const result = await productsRepository.updateStockAtomic(
        mockProduct.id,
        mockProduct.tenantId,
        5,
      );

      expect(result).toEqual(response);
    });

    shouldHandleDatabaseErrors(
      async (): Promise<UpdateResult> =>
        productsRepository.updateStockAtomic(
          mockProduct.id,
          mockProduct.tenantId,
          5,
        ),
      () => createQueryBuilderMock.execute,
    );
  });

  describe('deleteProduct', () => {
    const response: DeleteResult = {
      raw: [],
      affected: 1,
    };

    it('should return the delete result when .delete is resolved', async () => {
      ormRepositoryMock.delete?.mockResolvedValue(response);

      const result = await productsRepository.deleteProduct(
        mockProduct.sku,
        mockProduct.tenantId,
      );

      expect(result).toEqual(response);
    });

    shouldHandleDatabaseErrors(
      async (): Promise<DeleteResult> =>
        productsRepository.deleteProduct(mockProduct.sku, mockProduct.tenantId),
      () => ormRepositoryMock.delete,
    );
  });
});
