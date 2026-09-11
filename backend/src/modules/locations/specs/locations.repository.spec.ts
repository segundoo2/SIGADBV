/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { ObjectLiteral, Repository, EntityManager } from 'typeorm';
import { LocationsRepository } from '../locations.repository';
import { ELocationType, Location } from '../entities/location.entity';
import { LocationDto } from '../dtos/location.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { EErrorsGlobal } from '../../../common/enum/errors-global.enum';

type MockRepository<T extends ObjectLiteral> = {
  [P in keyof Repository<T>]?: Repository<T>[P] extends (
    ...args: infer A
  ) => infer R
    ? jest.Mock<R, A>
    : Repository<T>[P];
};

describe('LocationsRepository', () => {
  let repository: LocationsRepository;
  let repositoryOrm: MockRepository<Location>;

  beforeEach(async () => {
    const mockFactory = (): MockRepository<Location> => ({
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsRepository,
        {
          provide: getRepositoryToken(Location),
          useFactory: mockFactory,
        },
      ],
    }).compile();

    repository = module.get<LocationsRepository>(LocationsRepository);
    repositoryOrm = module.get<MockRepository<Location>>(
      getRepositoryToken(Location),
    );
  });

  const shouldHandleDatabaseErrors = (
    operation: () => Promise<unknown>,
    mockMethod: () => jest.Mock | undefined,
  ) => {
    it('should return InternalServerErrorException when TypeORM throws an error', async () => {
      mockMethod()?.mockRejectedValue(
        new Error('[TypeOrmModule] Unable to connect to the database'),
      );

      await expect(operation()).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  };

  const locationDto: LocationDto & { tenantId: string } = {
    tenantId: 'uuid',
    code: 'B1AP001',
    type: ELocationType.STORAGE,
    capacity: 100,
    description: 'descrição',
  };

  const updateLocationDto: UpdateLocationDto = {
    description: 'nova descrição',
    capacity: 150,
  };

  const response: Location = {
    id: 'uuid',
    tenantId: 'uuid',
    code: 'B1AP001',
    type: ELocationType.STORAGE,
    capacity: 100,
    description: 'descrição',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createLocation', () => {
    it('should invoke create and save operations successfully', async () => {
      repositoryOrm.create?.mockReturnValue(response);
      repositoryOrm.save?.mockResolvedValue(response);
      expect(await repository.createLocation(locationDto)).toEqual(response);
    });

    it('should use transactional EntityManager when provided', async () => {
      const txRepository = {
        create: jest.fn().mockReturnValue(response),
        save: jest.fn().mockResolvedValue(response),
      };
      const entityManager = {
        getRepository: jest.fn().mockReturnValue(txRepository),
      } as unknown as EntityManager;

      const result = await repository.createLocation(
        locationDto,
        entityManager,
      );

      expect(result).toEqual(response);
      expect(entityManager.getRepository).toHaveBeenCalledWith(Location);
      expect(txRepository.save).toHaveBeenCalled();
    });

    shouldHandleDatabaseErrors(
      () => repository.createLocation(locationDto),
      () => repositoryOrm.save,
    );
  });

  describe('findByCode', () => {
    it('should return a location object when it is found', async () => {
      repositoryOrm.findOne?.mockResolvedValue(response);
      expect(
        await repository.findByCode(locationDto.code, locationDto.tenantId),
      ).toEqual(response);
    });

    shouldHandleDatabaseErrors(
      () => repository.findByCode(locationDto.code, locationDto.tenantId),
      () => repositoryOrm.findOne,
    );
  });

  describe('findById', () => {
    it('should return a location object by ID when found', async () => {
      repositoryOrm.findOne?.mockResolvedValue(response);
      expect(await repository.findById(response.id, response.tenantId)).toEqual(
        response,
      );
    });

    shouldHandleDatabaseErrors(
      () => repository.findById(response.id, response.tenantId),
      () => repositoryOrm.findOne,
    );
  });

  describe('findAllPaginated', () => {
    it('should return paginated locations and total count', async () => {
      const locationsList = [response];
      repositoryOrm.findAndCount?.mockResolvedValue([locationsList, 1]);

      expect(
        await repository.findAllPaginated(locationDto.tenantId, 1, 10),
      ).toEqual({
        locations: locationsList,
        total: 1,
      });
    });

    shouldHandleDatabaseErrors(
      () => repository.findAllPaginated(locationDto.tenantId, 1, 10),
      () => repositoryOrm.findAndCount,
    );
  });

  describe('updateLocation', () => {
    it('should return update result when location found and updated', async () => {
      repositoryOrm.update?.mockResolvedValue({
        raw: [],
        affected: 1,
        generatedMaps: [],
      });

      expect(
        await repository.updateLocation(
          response.code,
          updateLocationDto,
          response.tenantId,
        ),
      ).toEqual({ raw: [], affected: 1, generatedMaps: [] });
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.updateLocation(
          locationDto.code,
          updateLocationDto,
          locationDto.tenantId,
        ),
      () => repositoryOrm.update,
    );
  });

  describe('deleteLocation', () => {
    it('should return delete result when location found and deleted', async () => {
      repositoryOrm.delete?.mockResolvedValue({
        raw: [],
        affected: 1,
      });

      expect(
        await repository.deleteLocation(response.code, response.tenantId),
      ).toEqual({ raw: [], affected: 1 });
    });

    shouldHandleDatabaseErrors(
      () => repository.deleteLocation(locationDto.code, locationDto.tenantId),
      () => repositoryOrm.delete,
    );
  });
});
