/* eslint-disable @typescript-eslint/unbound-method */
import { BadRequestException, ConflictException } from '@nestjs/common';
import { ELocationSuccessMessage } from '../../../common/enum/location/location-success.enum';
import { ELocationErrorsMessage } from '../../../common/enum/location/location-errors.enum';
import { LocationDto } from '../dtos/location.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { ELocationType, Location } from '../entities/location.entity';
import { ILocationsRepository } from '../interfaces/locations.repository.interface';
import { IProductLocationsRepository } from '../interfaces/product-locations.repository.interface';
import { LocationsService } from '../locations.service';
import { ProductLocation } from '../entities/product-location.entity';

describe('LocationsService', () => {
  let service: LocationsService;
  let repository: jest.Mocked<ILocationsRepository>;
  let productLocationsRepository: jest.Mocked<IProductLocationsRepository>;

  beforeEach(() => {
    repository = {
      createLocation: jest.fn(),
      findByCode: jest.fn(),
      findById: jest.fn(),
      findAllPaginated: jest.fn(),
      updateLocation: jest.fn(),
      deleteLocation: jest.fn(),
    };

    productLocationsRepository = {
      findByProductAndLocation: jest.fn(),
      countActiveProductsInLocation: jest.fn(),
      sumAllocatedStock: jest.fn(),
      incrementQuantity: jest.fn(),
      decrementQuantity: jest.fn(),
    };

    service = new LocationsService(repository, productLocationsRepository);
  });

  const tenantId = 'tenant-uuid';
  const productId = 'product-uuid';

  const locationStorage: Location = {
    id: 'loc-storage-id',
    tenantId,
    code: 'STORAGE-01',
    type: ELocationType.STORAGE,
    capacity: null,
    description: 'Estoque central',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const locationDisplay: Location = {
    id: 'loc-display-id',
    tenantId,
    code: 'DISPLAY-01',
    type: ELocationType.DISPLAY,
    capacity: 50,
    description: 'Gôndola A1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createLocation', () => {
    const validStorageDto: LocationDto & { tenantId: string } = {
      tenantId,
      code: 'STORAGE-01',
      type: ELocationType.STORAGE,
    };

    it('should create a STORAGE location without capacity', async () => {
      repository.findByCode.mockResolvedValue(null);
      repository.createLocation.mockResolvedValue(locationStorage);

      const result = await service.createLocation(validStorageDto);

      expect(result).toEqual({
        message: ELocationSuccessMessage.CREATE,
        data: null,
      });
    });

    it('should throw BadRequestException if DISPLAY is created without capacity', async () => {
      repository.findByCode.mockResolvedValue(null);

      const invalidDisplayDto: LocationDto & { tenantId: string } = {
        tenantId,
        code: 'DISPLAY-01',
        type: ELocationType.DISPLAY,
      };

      await expect(service.createLocation(invalidDisplayDto)).rejects.toThrow(
        new BadRequestException(ELocationErrorsMessage.CAPACITY_NULL),
      );
    });

    it('should throw ConflictException if code already exists', async () => {
      repository.findByCode.mockResolvedValue(locationStorage);

      await expect(service.createLocation(validStorageDto)).rejects.toThrow(
        new ConflictException(ELocationErrorsMessage.CONFLICT),
      );
    });
  });

  describe('allocateProduct & validateAllocation', () => {
    it('should allocate stock to DISPLAY when rules are met', async () => {
      repository.findById.mockImplementation((id) => {
        if (id === locationDisplay.id) return Promise.resolve(locationDisplay);
        if (id === locationStorage.id) return Promise.resolve(locationStorage);
        return Promise.resolve(null);
      });

      productLocationsRepository.findByProductAndLocation.mockImplementation(
        (prodId, locId) => {
          // Retorna estoque apenas se a busca for para a origem (STORAGE)
          if (locId === locationStorage.id) {
            return Promise.resolve({
              id: 'pl-storage-id',
              tenantId,
              productId: prodId,
              locationId: locationStorage.id,
              quantity: 100,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          // Para o destino (DISPLAY), o produto ainda não existe na gôndola
          return Promise.resolve(null);
        },
      );

      productLocationsRepository.countActiveProductsInLocation.mockResolvedValue(
        0,
      );

      await expect(
        service.allocateProduct({
          productId,
          targetLocationId: locationDisplay.id,
          sourceLocationId: locationStorage.id,
          quantity: 10,
          tenantId,
          currentProductStock: 100,
        }),
      ).resolves.not.toThrow();

      expect(productLocationsRepository.decrementQuantity).toHaveBeenCalledWith(
        productId,
        locationStorage.id,
        tenantId,
        10,
        undefined,
      );
      expect(productLocationsRepository.incrementQuantity).toHaveBeenCalledWith(
        productId,
        locationDisplay.id,
        tenantId,
        10,
        undefined,
      );
    });

    it('should throw BadRequestException if source and target locations are the same', async () => {
      await expect(
        service.allocateProduct({
          productId,
          targetLocationId: locationDisplay.id,
          sourceLocationId: locationDisplay.id,
          quantity: 10,
          tenantId,
          currentProductStock: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if DISPLAY target receives from non-STORAGE location', async () => {
      const anotherDisplay: Location = {
        ...locationDisplay,
        id: 'loc-display-2',
        code: 'DISPLAY-02',
      };

      repository.findById.mockImplementation(async (id) => {
        if (id === locationDisplay.id) return locationDisplay;
        if (id === anotherDisplay.id) return anotherDisplay;
        return Promise.resolve(null);
      });

      await expect(
        service.allocateProduct({
          productId,
          targetLocationId: locationDisplay.id,
          sourceLocationId: anotherDisplay.id,
          quantity: 10,
          tenantId,
          currentProductStock: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if DISPLAY position has another active SKU', async () => {
      repository.findById.mockResolvedValue(locationDisplay);
      productLocationsRepository.findByProductAndLocation.mockResolvedValue(
        null,
      );
      productLocationsRepository.countActiveProductsInLocation.mockResolvedValue(
        1,
      );

      await expect(
        service.allocateProduct({
          productId,
          targetLocationId: locationDisplay.id,
          quantity: 10,
          tenantId,
          currentProductStock: 100,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if allocation exceeds DISPLAY capacity', async () => {
      repository.findById.mockResolvedValue(locationDisplay); // capacity: 50
      productLocationsRepository.findByProductAndLocation.mockResolvedValue({
        id: 'pl-id',
        tenantId,
        productId,
        locationId: locationDisplay.id,
        quantity: 45,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      productLocationsRepository.countActiveProductsInLocation.mockResolvedValue(
        1,
      );

      await expect(
        service.allocateProduct({
          productId,
          targetLocationId: locationDisplay.id,
          quantity: 10, // 45 + 10 = 55 > 50
          tenantId,
          currentProductStock: 100,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateLocation', () => {
    it('should update location successfully', async () => {
      repository.findByCode.mockResolvedValue(locationStorage);
      repository.updateLocation.mockResolvedValue({
        raw: [],
        affected: 1,
        generatedMaps: [],
      });

      const updateDto: UpdateLocationDto = { description: 'Novo estoque' };

      const result = await service.updateLocation(
        locationStorage.code,
        updateDto,
        tenantId,
      );

      expect(result).toEqual({
        message: ELocationSuccessMessage.UPDATE,
        data: null,
      });
    });

    it('should throw BadRequestException if updating location to DISPLAY without capacity', async () => {
      repository.findByCode.mockResolvedValue(locationStorage);

      const updateDto: UpdateLocationDto = {
        type: ELocationType.DISPLAY,
        capacity: undefined,
      };

      await expect(
        service.updateLocation(locationStorage.code, updateDto, tenantId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteLocation', () => {
    it('should delete location successfully', async () => {
      repository.findByCode.mockResolvedValue({
        ...locationStorage,
        productLocations: [],
      });
      repository.deleteLocation.mockResolvedValue({ raw: [], affected: 1 });

      const result = await service.deleteLocation(
        locationStorage.code,
        tenantId,
      );

      expect(result).toEqual({
        message: ELocationSuccessMessage.DELETE,
        data: null,
      });
    });

    it('should throw ConflictException if location has active product links', async () => {
      repository.findByCode.mockResolvedValue({
        ...locationStorage,
        productLocations: [{} as ProductLocation],
      });

      await expect(
        service.deleteLocation(locationStorage.code, tenantId),
      ).rejects.toThrow(
        new ConflictException(ELocationErrorsMessage.CONFLICT_DELETE),
      );
    });
  });
});
