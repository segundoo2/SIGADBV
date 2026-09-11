/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException } from '@nestjs/common';
import { EMovementsSuccess } from '../../../common/enum/movements-success.enum';
import { EErrorsGlobal } from '../../../common/enum/errors-global.enum';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { AllocateLocationDto } from '../dtos/allocate-product-location.dto';
import { EMovementType, MovementDto } from '../dtos/movement.dto';
import { Movement } from '../entities/movement.entity';
import { IMovementsController } from '../interfaces/movements.controller.interface';
import { IMovementsService } from '../interfaces/movements.service.interface';
import { MovementsController } from '../movements.controller';

describe('MovementsController', () => {
  let controller: IMovementsController;
  let service: jest.Mocked<IMovementsService>;

  const tenantId = 'tenant-uuid-123';
  const productId = 'd3b07384-d113-424a-a1d2-06834d858348';

  const movementDto: MovementDto = {
    typeMovement: EMovementType.IN,
    productId,
    locationId: 'f21a48c9-598d-4a14-8789-08226edb3b0d',
    quantity: 10,
    reason: 'Entrada de nota fiscal de compra',
  };

  const allocateDto: AllocateLocationDto = {
    productId,
    targetLocationId: 'f21a48c9-598d-4a14-8789-08226edb3b0d',
    quantity: 5,
    reason: 'Alocação inicial',
  };

  beforeEach(() => {
    service = {
      registerMovement: jest.fn(),
      allocateLocation: jest.fn(),
      findAllPaginatedByProduct: jest.fn(),
    };

    controller = new MovementsController(service);
  });

  describe('registerMovement', () => {
    it('should return success response when stock movement is registered', async () => {
      const responseNull: IResponse<null> = {
        message: EMovementsSuccess.CREATE,
        data: null,
      };

      service.registerMovement.mockResolvedValue(responseNull);

      expect(await controller.registerMovement(movementDto, tenantId)).toEqual(
        responseNull,
      );
      expect(service.registerMovement).toHaveBeenCalledWith({
        ...movementDto,
        tenantId,
      });
    });

    it('should throw BadRequestException when tenantId is missing', async () => {
      await expect(
        controller.registerMovement(movementDto, ''),
      ).rejects.toThrow(new BadRequestException(EErrorsGlobal.INVALID_DATA));
    });
  });

  describe('allocateLocation', () => {
    it('should return success response when location allocation succeeds', async () => {
      const allocateResponse: IResponse<null> = {
        message: EMovementsSuccess.ALLOCATE_PRODUCT,
        data: null,
      };

      service.allocateLocation.mockResolvedValue(allocateResponse);

      expect(await controller.allocateLocation(allocateDto, tenantId)).toEqual(
        allocateResponse,
      );
      expect(service.allocateLocation).toHaveBeenCalledWith({
        ...allocateDto,
        tenantId,
      });
    });

    it('should throw BadRequestException when tenantId is missing', async () => {
      await expect(
        controller.allocateLocation(allocateDto, ''),
      ).rejects.toThrow(new BadRequestException(EErrorsGlobal.INVALID_DATA));
    });
  });

  describe('findAllPaginatedByProduct', () => {
    it('should return paginated list of movements for a product', async () => {
      const paginatedResponse: IPaginatedResponse<Movement[]> = {
        message: EMovementsSuccess.FIND_ALL,
        data: [],
        meta: {
          itemCount: 0,
          totalItems: 0,
          itemsPerPage: 10,
          totalPages: 0,
          currentPage: 1,
        },
      };

      service.findAllPaginatedByProduct.mockResolvedValue(paginatedResponse);

      const query = { page: 1, limit: 10 };
      expect(
        await controller.findAllPaginatedByProduct(productId, tenantId, query),
      ).toEqual(paginatedResponse);
      expect(service.findAllPaginatedByProduct).toHaveBeenCalledWith(
        productId,
        tenantId,
        query,
      );
    });

    it('should throw BadRequestException when tenantId is missing', async () => {
      await expect(
        controller.findAllPaginatedByProduct(productId, '', {
          page: 1,
          limit: 10,
        }),
      ).rejects.toThrow(new BadRequestException(EErrorsGlobal.INVALID_DATA));
    });
  });
});
