import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ScoreHistoryRepository } from '../score-history.repository';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { ScoreHistoryDto } from '../dtos/score-history.dto';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UnitRepository', () => {
  let repository: ScoreHistoryRepository;
  let ormMock: MockRepository<ScoreHistoryEntity>;
  const mockScoreHistory: ScoreHistoryEntity = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    score: 150,
    description: 'Bônus por participação em evento',
    createdAt: new Date('2026-09-23T20:00:00.000Z'),
    updatedAt: new Date('2026-09-23T20:00:00.000Z'),
    unit: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      tenantId: 'd3b07384-d113-4ec6-a4f6-53856372d681',
      name: 'Unidade Alpha',
      gender: EUnitGender.MALE,
      maxMembers: 8,
      score: 150,
      scoreHistories: [],
      createdAt: new Date('2026-09-18T22:00:00.000Z'),
      updatedAt: new Date('2026-09-18T22:00:00.000Z'),
    },
  };
  const mockDto: ScoreHistoryDto = {
    score: mockScoreHistory.score,
    description: mockScoreHistory.description,
  };

  beforeEach(async () => {
    const mockFactory = (): MockRepository<ScoreHistoryEntity> => ({
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
        ScoreHistoryRepository,

        {
          provide: getRepositoryToken(ScoreHistoryEntity),

          useFactory: mockFactory,
        },
      ],
    }).compile();

    repository = module.get<ScoreHistoryRepository>(ScoreHistoryRepository);

    ormMock = module.get<MockRepository<ScoreHistoryEntity>>(
      getRepositoryToken(ScoreHistoryEntity),
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

  describe('adjustUnitScore', () => {
    it('should persist the score history when the adjust is a success', async () => {
      ormMock.create.mockReturnValue(mockScoreHistory);
      ormMock.save.mockResolvedValue(mockScoreHistory);

      await expect(
        repository.adjustUnitScore({
          unitId: mockScoreHistory.unitId,
          tenantId: mockScoreHistory.tenantId,
          ...mockDto,
        }),
      ).resolves.toBeUndefined();

      expect(ormMock.create).toHaveBeenCalledWith({
        unitId: mockScoreHistory.unitId,
        tenantId: mockScoreHistory.tenantId,
        score: mockDto.score,
        description: mockDto.description,
      });

      expect(ormMock.save).toHaveBeenCalledWith(mockScoreHistory);
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.adjustUnitScore({
          unitId: 'uuid',
          tenantId: 'uuid',
          ...mockDto,
        }),
      () => ormMock.save,
    );
  });

  describe('findHistoryByUnitId', () => {
    it('should return score history when he is found', async () => {
      ormMock.findOne.mockResolvedValue(mockScoreHistory);
      expect(
        await repository.findHistoryByUnitId(
          mockScoreHistory.unitId,
          mockScoreHistory.tenantId,
        ),
      ).toEqual(mockScoreHistory);
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.findHistoryByUnitId(
          mockScoreHistory.unitId,
          mockScoreHistory.tenantId,
        ),
      () => ormMock.findOne,
    );
  });
});
