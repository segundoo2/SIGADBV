import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral, Repository } from 'typeorm';
import { ScoreHistoryRepository } from '../score-history.repository';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { IJwtPayloadWithExpiry } from '../../../modules/auth/interfaces/jwt-payload.interface';
import { User } from '../../../modules/users/entities/user.entity';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('ScoreHistoryRepository', () => {
  let repository: ScoreHistoryRepository;
  let ormMock: MockRepository<ScoreHistoryEntity>;

  const mockUserPayload: IJwtPayloadWithExpiry = {
    sub: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
    username: 'admin.user',
    roles: ['Admin'],
    permissions: [],
    fingerprint: 'mock-fingerprint',
    exp: Date.now() + 3600,
  };

  const mockScoreHistory: ScoreHistoryEntity = {
    id: '123e4567-e89b-12d3-a456-426614174111',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    isApproved: false,
    approvedById: null,
    createdById: '123e4567-e89b-12d3-a456-426614174000',
    approvedBy: null,
    createdBy: {} as User,
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
          currentUser: mockUserPayload.sub,
          ...mockDto,
        }),
      ).resolves.toBeUndefined();

      expect(ormMock.create).toHaveBeenCalledWith({
        unitId: mockScoreHistory.unitId,
        tenantId: mockScoreHistory.tenantId,
        currentUser: mockUserPayload.sub,
        createdById: mockUserPayload.sub,
        isApproved: false,
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
          currentUser: 'uuid',
          ...mockDto,
        }),
      () => ormMock.save,
    );
  });

  describe('findAllHistoryScorePending', () => {
    it('should return pending score histories successfully', async () => {
      const expectedResult = [mockScoreHistory];
      ormMock.find.mockResolvedValue(expectedResult);

      await expect(
        repository.findAllHistoryScorePending(mockScoreHistory.tenantId),
      ).resolves.toEqual(expectedResult);

      expect(ormMock.find).toHaveBeenCalledWith({
        where: {
          tenantId: mockScoreHistory.tenantId,
          isApproved: false,
        },
        relations: {
          createdBy: true,
          unit: true,
        },
        order: { createdAt: 'ASC' },
      });
    });

    shouldHandleDatabaseErrors(
      () => repository.findAllHistoryScorePending('uuid-tenant'),
      () => ormMock.find,
    );
  });

  describe('approveScore', () => {
    it('should update score history to approved successfully', async () => {
      ormMock.update.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });

      await expect(
        repository.approveScore(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
          mockUserPayload,
        ),
      ).resolves.toBeUndefined();

      expect(ormMock.update).toHaveBeenCalledWith(
        { id: mockScoreHistory.id, tenantId: mockScoreHistory.tenantId },
        { isApproved: true, approvedById: mockUserPayload.sub },
      );
    });

    shouldHandleDatabaseErrors(
      () =>
        repository.approveScore(
          mockScoreHistory.id,
          mockScoreHistory.tenantId,
          mockUserPayload,
        ),
      () => ormMock.update,
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
});
