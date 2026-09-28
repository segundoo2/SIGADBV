import { ObjectLiteral, Repository } from 'typeorm';
import { MetricsRepository } from '../metrics.repository';
import { UnitEntity } from '../../units/entities/unit.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UnitRepository', () => {
  let repository: MetricsRepository;
  let ormMock: MockRepository<UnitEntity>;

  beforeEach(async () => {
    const mockFactory = (): MockRepository<UnitEntity> => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsRepository,

        {
          provide: getRepositoryToken(UnitEntity),

          useFactory: mockFactory,
        },
      ],
    }).compile();

    repository = module.get<MetricsRepository>(MetricsRepository);

    ormMock = module.get<MockRepository<UnitEntity>>(
      getRepositoryToken(UnitEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const shouldHandleDatabaseErrors = (
    operation: () => Promise<unknown>,
    mockMethod: () => jest.Mock | undefined,
  ) => {
    it('should throw InternalServerErrorException when TypeORM operation fails', async () => {
      mockMethod()?.mockRejectedValue(new Error('Database error'));

      await expect(operation()).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  };

  describe('findListScoreUnits', () => {
    const response = { name: 'unit', score: 100 };

    it('should return [{ name: string, score: number }] when the find is a success', async () => {
      ormMock.find.mockResolvedValue(response);
      expect(await repository.findListScoreUnits('uuid-tenant')).toEqual(
        response,
      );
    });

    shouldHandleDatabaseErrors(
      () => repository.findListScoreUnits('uuid-tenant'),
      () => ormMock.find,
    );
  });
});
