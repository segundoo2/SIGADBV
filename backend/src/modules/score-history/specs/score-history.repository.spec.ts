import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ScoreHistoryRepository } from '../score-history.repository';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { UnitEntity } from '../../units/entities/unit.entity';
import { EScoreHistoryStatus } from '../../../common/enum/score-story/score-history-status.enum';
import { User } from '../../users/entities/user.entity';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ScoreHistoryRepository', () => {
  let repository: ScoreHistoryRepository;
  let ormMock: MockRepository<ScoreHistoryEntity>;
  let unitOrmMock: MockRepository<UnitEntity>;

  const mockScoreHistory: ScoreHistoryEntity = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    score: 150,
    description: 'Bônus por participação em evento',
    status: EScoreHistoryStatus.PENDING,
    requestedById: '123e4567-e89b-12d3-a456-426614174222',
    requestedBy: {
      id: '123e4567-e89b-12d3-a456-426614174222',
      name: 'Utilizador Teste',
    } as unknown as User,
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
        {
          provide: getRepositoryToken(UnitEntity),
          useFactory: mockFactory,
        },
      ],
    }).compile();

    repository = module.get<ScoreHistoryRepository>(ScoreHistoryRepository);

    ormMock = module.get<MockRepository<ScoreHistoryEntity>>(
      getRepositoryToken(ScoreHistoryEntity),
    );
    unitOrmMock = module.get<MockRepository<UnitEntity>>(
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

  describe('requestAdjustUnitScore', () => {
    it('should persist the score history when the request is a success', async () => {
      ormMock.create.mockReturnValue(mockScoreHistory);
      ormMock.save.mockResolvedValue(mockScoreHistory);

      await expect(
        repository.requestAdjustUnitScore({
          unitId: mockScoreHistory.unitId,
          tenantId: mockScoreHistory.tenantId,
          requestedById: mockScoreHistory.requestedById,
          status: EScoreHistoryStatus.PENDING,
          ...mockDto,
        }),
      ).resolves.toBeUndefined();

      expect(ormMock.create).toHaveBeenCalledWith({
        unitId: mockScoreHistory.unitId,
        tenantId: mockScoreHistory.tenantId,
        requestedById: mockScoreHistory.requestedById,
        status: EScoreHistoryStatus.PENDING,
        score: mockDto.score,
        description: mockDto.description,
      });

      expect(ormMock.save).toHaveBeenCalledWith(mockScoreHistory);
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.requestAdjustUnitScore({
          unitId: 'uuid',
          tenantId: 'uuid',
          requestedById: 'uuid',
          status: EScoreHistoryStatus.PENDING,
          ...mockDto,
        }),
      () => ormMock.save,
    );
  });

  describe('findHistoryByUnitId', () => {
    it('should return score history when it is found', async () => {
      const expectedResult = [mockScoreHistory];
      ormMock.find.mockResolvedValue(expectedResult);

      await expect(
        repository.findHistoryByUnitId(
          mockScoreHistory.unitId,
          mockScoreHistory.tenantId,
        ),
      ).resolves.toEqual(expectedResult);

      expect(ormMock.find).toHaveBeenCalledWith({
        where: {
          unitId: mockScoreHistory.unitId,
          tenantId: mockScoreHistory.tenantId,
        },
        order: { createdAt: 'DESC' },
        take: undefined,
        relations: { requestedBy: true, approvedBy: true, rejectedBy: true },
      });
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.findHistoryByUnitId(
          mockScoreHistory.unitId,
          mockScoreHistory.tenantId,
        ),
      () => ormMock.find,
    );
  });

  describe('findAllUnitsNameAndId', () => {
    it('should return a list of units with only id and name', async () => {
      const expectedUnits = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Unidade Alpha',
        },
      ];
      unitOrmMock.find.mockResolvedValue(expectedUnits);

      await expect(
        repository.findAllUnitsNameAndId(mockScoreHistory.tenantId),
      ).resolves.toEqual(expectedUnits);

      expect(unitOrmMock.find).toHaveBeenCalledWith({
        where: { tenantId: mockScoreHistory.tenantId },
        select: { id: true, name: true },
      });
    });

    shouldHandleDatabaseErrors(
      () => repository.findAllUnitsNameAndId(mockScoreHistory.tenantId),
      () => unitOrmMock.find,
    );
  });

  describe('retrivePendingUnitsScore', () => {
    it('should return pending units score list', async () => {
      const expectedResult = [mockScoreHistory];
      ormMock.find.mockResolvedValue(expectedResult);

      await expect(
        repository.retrivePendingUnitsScore(
          mockScoreHistory.unitId,
          mockScoreHistory.tenantId,
        ),
      ).resolves.toEqual(expectedResult);

      expect(ormMock.find).toHaveBeenCalledWith({
        where: {
          unitId: mockScoreHistory.unitId,
          tenantId: mockScoreHistory.tenantId,
          status: EScoreHistoryStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
        relations: { requestedBy: true },
      });
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.retrivePendingUnitsScore(
          mockScoreHistory.unitId,
          mockScoreHistory.tenantId,
        ),
      () => ormMock.find,
    );
  });

  describe('findOneScoreHistoryPending', () => {
    it('should return a score history when found', async () => {
      ormMock.findOne.mockResolvedValue(mockScoreHistory);

      await expect(
        repository.findOneScoreHistoryPending(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
        ),
      ).resolves.toEqual(mockScoreHistory);

      expect(ormMock.findOne).toHaveBeenCalledWith({
        where: {
          id: mockScoreHistory.id,
          tenantId: mockScoreHistory.tenantId,
        },
      });
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.findOneScoreHistoryPending(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
        ),
      () => ormMock.findOne,
    );
  });

  describe('approveScoreHistory', () => {
    it('should update score history status to approved', async () => {
      ormMock.update.mockResolvedValue({ affected: 1 });

      await expect(
        repository.approveScoreHistory(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
          'approver-uuid',
        ),
      ).resolves.toBeUndefined();

      expect(ormMock.update).toHaveBeenCalledWith(
        { id: mockScoreHistory.id, tenantId: mockScoreHistory.tenantId },
        { status: EScoreHistoryStatus.APPROVED, approvedById: 'approver-uuid' },
      );
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.approveScoreHistory(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
          'approver-uuid',
        ),
      () => ormMock.update,
    );
  });

  describe('rejectScoreHistory', () => {
    it('should update score history status to rejected', async () => {
      ormMock.update.mockResolvedValue({ affected: 1 });

      await expect(
        repository.rejectScoreHistory(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
          'rejecter-uuid',
        ),
      ).resolves.toBeUndefined();

      expect(ormMock.update).toHaveBeenCalledWith(
        { id: mockScoreHistory.id, tenantId: mockScoreHistory.tenantId },
        { status: EScoreHistoryStatus.REJECTED, rejectedById: 'rejecter-uuid' },
      );
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.rejectScoreHistory(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
          'rejecter-uuid',
        ),
      () => ormMock.update,
    );
  });
});
