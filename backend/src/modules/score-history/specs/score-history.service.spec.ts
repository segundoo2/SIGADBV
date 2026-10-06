/* eslint-disable @typescript-eslint/unbound-method */
import { IUnitsService } from '../../units/interfaces/units.service.interface';
import { ScoreHistoryService } from '../score-history.service';
import { IScoreHistoryRepository } from '../interfaces/score-history.repository.interface';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { EScoreHistorySuccess } from '../../../common/enum/score-story/score-history-success.enum';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { NotFoundException } from '@nestjs/common';
import { EScoreHistoryErrors } from '../../../common/enum/score-story/score-history-errors.enum';
import { IJwtPayloadWithExpiry } from '../../../modules/auth/interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

describe('ScoreHistoryService', () => {
  let service: ScoreHistoryService;
  let repository: jest.Mocked<IScoreHistoryRepository>;
  let unitsService: jest.Mocked<Partial<IUnitsService>>;

  const dto: ScoreHistoryDto = {
    score: 100,
    description: 'Prova x',
  };
  const unit = {
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: '153e4567-e89b-12d3-3556-426614174000',
  };

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

  beforeEach(() => {
    repository = {
      adjustUnitScore: jest.fn(),
      findAllHistoryScorePending: jest.fn(),
      approveScore: jest.fn(),
      findHistoryByUnitId: jest.fn(),
    };

    unitsService = {
      adjustUnitScore: jest.fn(),
    };

    service = new ScoreHistoryService(
      repository,
      unitsService as IUnitsService,
    );
  });

  describe('adjustUnitScore', () => {
    it('should register score history as pending successfully', async () => {
      repository.adjustUnitScore.mockResolvedValue();

      const result = await service.adjustUnitScore(
        unit.unitId,
        mockUserPayload.sub,
        unit.tenantId,
        dto,
      );

      expect(result).toEqual({
        message: EScoreHistorySuccess.FIND,
        data: { newScore: 0 },
      });
      expect(repository.adjustUnitScore).toHaveBeenCalled();
    });
  });

  describe('findAllHistoryScorePending', () => {
    it('should return pending score histories successfully', async () => {
      repository.findAllHistoryScorePending.mockResolvedValue([
        mockScoreHistory,
      ]);

      const result = await service.findAllHistoryScorePending(unit.tenantId);

      expect(result).toEqual({
        message: EScoreHistorySuccess.FIND,
        data: [mockScoreHistory],
      });
    });
  });

  describe('approveScore', () => {
    it('should approve score and update unit score successfully', async () => {
      repository.findAllHistoryScorePending.mockResolvedValue([
        mockScoreHistory,
      ]);
      unitsService.adjustUnitScore.mockResolvedValue({
        message: 'Success',
        data: { newScore: 300 },
      });
      repository.approveScore.mockResolvedValue();

      const result = await service.approveScore(
        mockScoreHistory.id,
        unit.tenantId,
        mockUserPayload,
      );

      expect(result).toEqual({
        message: EScoreHistorySuccess.APPROVE,
        data: null,
      });
      expect(unitsService.adjustUnitScore).toHaveBeenCalledWith(
        mockScoreHistory.unitId,
        unit.tenantId,
        mockScoreHistory.score,
      );
      expect(repository.approveScore).toHaveBeenCalledWith(
        mockScoreHistory.id,
        unit.tenantId,
        mockUserPayload,
      );
    });

    it('should throw NotFoundException if pending history item is not found', async () => {
      repository.findAllHistoryScorePending.mockResolvedValue([]);

      await expect(
        service.approveScore('invalid-id', unit.tenantId, mockUserPayload),
      ).rejects.toThrow(new NotFoundException(EScoreHistoryErrors.NOT_FOUND));
    });
  });

  describe('findHistoryByUnitId', () => {
    it('should return score history when found', async () => {
      repository.findHistoryByUnitId.mockResolvedValue([mockScoreHistory]);

      const result = await service.findHistoryByUnitId(
        unit.unitId,
        unit.tenantId,
      );

      expect(result).toEqual({
        message: EScoreHistorySuccess.FIND,
        data: [mockScoreHistory],
      });
    });

    it('should throw NotFoundException when score history is not found', async () => {
      repository.findHistoryByUnitId.mockResolvedValue(null);

      await expect(
        service.findHistoryByUnitId(unit.unitId, unit.tenantId),
      ).rejects.toThrow(new NotFoundException(EScoreHistoryErrors.NOT_FOUND));
    });
  });
});
