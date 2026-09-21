/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { EMovementsSuccess } from '../../../common/enum/movements/movements-success.enum';
import { EProductsErrors } from '../../../common/enum/product/products-errors.enum';
import { ILocationsService } from '../../locations/interfaces/locations.service.interface';
import { Product } from '../../products/entities/product.entity';
import { IProductsService } from '../../products/interfaces/products.service.interface';
import { AllocateLocationDto } from '../dtos/allocate-product-location.dto';
import { EMovementType, MovementDto } from '../dtos/movement.dto';
import { IMovementsRepository } from '../interfaces/movements.repository.interface';
import { IMovementsService } from '../interfaces/movements.service.interface';
import { MovementsService } from '../movements.service';

describe('MovementsService', () => {
  let service: IMovementsService;
  let mockMovementsRepository: jest.Mocked<IMovementsRepository>;
  let mockProductsService: jest.Mocked<IProductsService>;
  let mockLocationsService: jest.Mocked<ILocationsService>;
  let mockDataSource: Partial<DataSource>;

  const mockEntityManager = {} as EntityManager;
  const tenantId = 'tenant-uuid-123';
  const productId = 'd3b07384-d113-424a-a1d2-06834d858348';

  const movementDto: MovementDto & { tenantId: string } = {
    tenantId,
    typeMovement: EMovementType.IN,
    productId,
    locationId: 'f21a48c9-598d-4a14-8789-08226edb3b0d',
    quantity: 10,
    reason: 'Entrada NF',
  };

  const allocateDto: AllocateLocationDto & { tenantId: string } = {
    tenantId,
    productId,
    targetLocationId: 'loc-target-uuid',
    quantity: 5,
  };

  const mockProduct = {
    id: productId,
    tenantId,
    currentStock: 10,
  } as Product;

  beforeEach(() => {
    mockMovementsRepository = {
      registerMovement: jest.fn(),
      findAllPaginatedByProduct: jest.fn(),
    };

    mockProductsService = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      applyStockDelta: jest.fn(),
      findOneBySku: jest.fn(),
      findOneById: jest.fn(),
      findAllProducts: jest.fn(),
      deleteProduct: jest.fn(),
    };

    mockLocationsService = {
      createLocation: jest.fn(),
      findByCode: jest.fn(),
      findAllLocations: jest.fn(),
      updateLocation: jest.fn(),
      deleteLocation: jest.fn(),
      findById: jest.fn(),
      allocateProduct: jest.fn(),
      sumAllocatedStock: jest.fn(),
      incrementQuantity: jest.fn(),
      decrementQuantity: jest.fn(),
    };

    mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          async <T>(
            cb: (entityManager: EntityManager) => Promise<T>,
          ): Promise<T> => {
            return await cb(mockEntityManager);
          },
        ),
    };

    service = new MovementsService(
      mockMovementsRepository,
      mockProductsService,
      mockLocationsService,
      mockDataSource as DataSource,
    );
  });

  describe('registerMovement', () => {
    it('should register IN movement successfully', async () => {
      mockProductsService.findOneById.mockResolvedValue(mockProduct);
      mockProductsService.applyStockDelta.mockResolvedValue({
        message: 'Success',
        data: { newCurrentStock: 20, uom: 'UN' },
      });

      const result = await service.registerMovement(movementDto);

      expect(result).toEqual({
        message: EMovementsSuccess.CREATE,
        data: null,
      });
      expect(mockProductsService.applyStockDelta).toHaveBeenCalledWith(
        productId,
        tenantId,
        10,
        mockEntityManager,
      );
      expect(mockMovementsRepository.registerMovement).toHaveBeenCalledWith(
        movementDto,
        mockEntityManager,
      );
    });

    it('should register OUT movement using negative delta', async () => {
      const outDto = { ...movementDto, typeMovement: EMovementType.OUT };
      mockProductsService.findOneById.mockResolvedValue(mockProduct);
      mockProductsService.applyStockDelta.mockResolvedValue({
        message: 'Success',
        data: { newCurrentStock: 0, uom: 'UN' },
      });

      await service.registerMovement(outDto);

      expect(mockProductsService.applyStockDelta).toHaveBeenCalledWith(
        productId,
        tenantId,
        -10,
        mockEntityManager,
      );
    });

    it('should throw NotFoundException if product is not found', async () => {
      mockProductsService.findOneById.mockResolvedValue(null);

      await expect(service.registerMovement(movementDto)).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
    });
  });

  describe('allocateLocation', () => {
    it('should allocate unallocated stock to location successfully', async () => {
      mockProductsService.findOneById.mockResolvedValue(mockProduct);
      mockLocationsService.allocateProduct.mockResolvedValue();

      const result = await service.allocateLocation(allocateDto);

      expect(result).toEqual({
        message: EMovementsSuccess.ALLOCATE_PRODUCT,
        data: null,
      });
      expect(mockLocationsService.allocateProduct).toHaveBeenCalledWith(
        {
          productId: allocateDto.productId,
          targetLocationId: allocateDto.targetLocationId,
          sourceLocationId: undefined,
          quantity: allocateDto.quantity,
          tenantId: allocateDto.tenantId,
          currentProductStock: Number(mockProduct.currentStock),
        },
        mockEntityManager,
      );
      expect(mockMovementsRepository.registerMovement).toHaveBeenCalledWith(
        {
          tenantId: allocateDto.tenantId,
          productId: allocateDto.productId,
          locationId: allocateDto.targetLocationId,
          quantity: allocateDto.quantity,
          typeMovement: EMovementType.TRANSFER,
          reason: `Alocação do estoque geral para a posição ${allocateDto.targetLocationId}`,
        },
        mockEntityManager,
      );
    });

    it('should throw NotFoundException if product is not found', async () => {
      mockProductsService.findOneById.mockResolvedValue(null);

      await expect(service.allocateLocation(allocateDto)).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
    });

    it('should register both OUT and IN movements when sourceLocationId is provided (transfer)', async () => {
      const transferDto = {
        ...allocateDto,
        sourceLocationId: 'loc-source-uuid',
      };
      mockProductsService.findOneById.mockResolvedValue(mockProduct);
      mockLocationsService.allocateProduct.mockResolvedValue();

      await service.allocateLocation(transferDto);

      expect(mockMovementsRepository.registerMovement).toHaveBeenCalledWith(
        {
          tenantId: transferDto.tenantId,
          productId: transferDto.productId,
          locationId: transferDto.sourceLocationId,
          quantity: transferDto.quantity,
          typeMovement: EMovementType.OUT,
          reason: `Transferência para posição ${transferDto.targetLocationId}`,
        },
        mockEntityManager,
      );

      expect(mockMovementsRepository.registerMovement).toHaveBeenCalledWith(
        {
          tenantId: transferDto.tenantId,
          productId: transferDto.productId,
          locationId: transferDto.targetLocationId,
          quantity: transferDto.quantity,
          typeMovement: EMovementType.IN,
          reason: `Transferência recebida da posição ${transferDto.sourceLocationId}`,
        },
        mockEntityManager,
      );
    });
  });

  describe('findAllPaginatedByProduct', () => {
    it('should return paginated movements list when product exists', async () => {
      mockProductsService.findOneById.mockResolvedValue(mockProduct);
      mockMovementsRepository.findAllPaginatedByProduct.mockResolvedValue({
        movements: [],
        total: 0,
      });

      const result = await service.findAllPaginatedByProduct(
        productId,
        tenantId,
        { page: 1, limit: 10 },
      );

      expect(result.message).toBe(EMovementsSuccess.FIND_ALL);
      expect(result.data).toEqual([]);
      expect(result.meta.currentPage).toBe(1);
    });

    it('should throw NotFoundException if product does not exist', async () => {
      mockProductsService.findOneById.mockResolvedValue(null);

      await expect(
        service.findAllPaginatedByProduct(productId, tenantId, {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(
        new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND),
      );
    });
  });
});
