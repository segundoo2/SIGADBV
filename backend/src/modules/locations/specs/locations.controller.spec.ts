import { ELocationSuccessMessage } from '../../../common/enum/location-success.enum';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { LocationDto } from '../dtos/location.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { ELocationType, Location } from '../entities/location.entity';
import { ILocationsService } from '../interfaces/locations.service.interface';
import { LocationsController } from '../locations.controller';

const createMockLocationsService = (): jest.Mocked<ILocationsService> =>
  ({
    createLocation: jest.fn(),
    findByCode: jest.fn(),
    findAllLocations: jest.fn(),
    updateLocation: jest.fn(),
    deleteLocation: jest.fn(),
  }) as unknown as jest.Mocked<ILocationsService>;

describe('LocationController', () => {
  let controller: LocationsController;
  let service: jest.Mocked<ILocationsService>;

  beforeEach(() => {
    service = createMockLocationsService();
    controller = new LocationsController(service);
  });

  const tenantId = 'uuid';
  const locationDto: LocationDto = {
    code: 'B1AP001',
    type: ELocationType.STORAGE,
    description: 'descrição',
  };
  const updateLocationDto: UpdateLocationDto = {
    description: 'nova descrição',
  };
  const responseService: Location = {
    id: 'uuid',
    tenantId: 'uuid',
    code: 'B1AP001',
    type: ELocationType.STORAGE,
    description: 'descrição',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createLocation', () => {
    it(`should return the object {message: ${ELocationSuccessMessage.CREATE}, data: null}`, async () => {
      const response: IResponse<null> = {
        message: ELocationSuccessMessage.CREATE,
        data: null,
      };

      service.createLocation.mockResolvedValue(response);

      expect(await controller.createLocation(tenantId, locationDto)).toEqual(
        response,
      );
    });
  });

  describe('findByCode', () => {
    it(`should return { message: ${ELocationSuccessMessage.FINDONE}, data: Location } when Location is found`, async () => {
      const response: IResponse<Location> = {
        message: ELocationSuccessMessage.FINDONE,
        data: responseService,
      };

      service.findByCode.mockResolvedValue(response);

      expect(
        await controller.findByCode(
          responseService.code,
          responseService.tenantId,
        ),
      ).toEqual(response);
    });
  });

  describe('findAllLocations', () => {
    it('should return paginated response from service', async () => {
      const expectedResponse: IPaginatedResponse<Location[]> = {
        message: ELocationSuccessMessage.FIND_ALL,
        data: [responseService],
        meta: {
          itemCount: 1,
          totalItems: 1,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      };

      service.findAllLocations.mockResolvedValue(expectedResponse);

      expect(
        await controller.findAllLocations(tenantId, { page: 1, limit: 10 }),
      ).toEqual(expectedResponse);
    });
  });

  describe('updateLocation', () => {
    it(`should return { message: ${ELocationSuccessMessage.UPDATE}, data: null }`, async () => {
      const response: IResponse<null> = {
        message: ELocationSuccessMessage.UPDATE,
        data: null,
      };

      service.updateLocation.mockResolvedValue(response);

      expect(
        await controller.updateLocation(
          responseService.code,
          updateLocationDto,
          responseService.tenantId,
        ),
      ).toEqual(response);
    });
  });

  describe('deleteLocation', () => {
    it(`should return { message: ${ELocationSuccessMessage.DELETE}, data: null }`, async () => {
      const response: IResponse<null> = {
        message: ELocationSuccessMessage.DELETE,
        data: null,
      };

      service.deleteLocation.mockResolvedValue(response);

      expect(
        await controller.deleteLocation(
          responseService.code,
          responseService.tenantId,
        ),
      ).toEqual(response);
    });
  });
});
