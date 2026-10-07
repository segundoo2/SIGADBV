/* eslint-disable @typescript-eslint/unbound-method */
import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { IUnitsService } from '../../units/interfaces/units.service.interface';
import { ScoreHistoryService } from '../score-history.service';
import { IScoreHistoryRepository } from '../interfaces/score-history.repository.interface';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { EScoreHistorySuccess } from '../../../common/enum/score-story/score-history-success.enum';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EScoreHistoryErrors } from '../../../common/enum/score-story/score-history-errors.enum';
import { EUnitErrors } from '../../../common/enum/unit/unit-errors.enum';
import { EScoreHistoryStatus } from '../../../common/enum/score-story/score-history-status.enum';
import { User } from '../../users/entities/user.entity';

describe('ScoreHistoryService', () => {
  let service: ScoreHistoryService;
  let repository: jest.Mocked<IScoreHistoryRepository>;
  let unitsService: jest.Mocked<IUnitsService>;

  const dto: ScoreHistoryDto = {
    score: 100,
    description: 'Prova x',
  };

  const unit = {
    unitId: '123e4567-e89b-12d3-a456-426614174000',
    tenantId: 'd3b07384-d113-4ec6-a4f6-53856372d681',
    userId: '123e4567-e89b-12d3-a456-426614174222',
  };

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

  beforeEach(() => {
    repository = {
      requestAdjustUnitScore: jest.fn(),
      findHistoryByUnitId: jest.fn(),
      findAllUnitsNameAndId: jest.fn(),
      retrivePendingUnitsScore: jest.fn(),
      findOneScoreHistoryPending: jest.fn(),
      approveScoreHistory: jest.fn(),
      rejectScoreHistory: jest.fn(),
    };

    unitsService = {
      adjustUnitScore: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<IUnitsService>;

    service = new ScoreHistoryService(repository, unitsService);
  });

  describe('requestAdjustUnitScore', () => {
    it('should request adjust unit score with success', async () => {
      repository.requestAdjustUnitScore.mockResolvedValue();

      const result = await service.requestAdjustUnitScore(
        unit.unitId,
        unit.userId,
        unit.tenantId,
        dto,
      );

      expect(result).toEqual({
        message: EScoreHistorySuccess.REQUEST_SCORE,
        data: null,
      });
      expect(repository.requestAdjustUnitScore).toHaveBeenCalledWith({
        unitId: unit.unitId,
        requestedById: unit.userId,
        tenantId: unit.tenantId,
        status: EScoreHistoryStatus.PENDING,
        ...dto,
      });
    });
  });

  describe('findHistoryByUnitId', () => {
    it('should return score history when found with success', async () => {
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

  describe('findAllUnitsNameAndId', () => {
    it('should return units name and id list when units are found', async () => {
      const units = [
        {
          id: unit.unitId,
          name: 'Unidade Alpha',
        },
      ];
      repository.findAllUnitsNameAndId.mockResolvedValue(units);

      const result = await service.findAllUnitsNameAndId(unit.tenantId);

      expect(result).toEqual({
        message: EUnitSuccess.FIND,
        data: units,
      });
    });

    it('should throw NotFoundException when no units are found', async () => {
      repository.findAllUnitsNameAndId.mockResolvedValue([]);

      await expect(
        service.findAllUnitsNameAndId(unit.tenantId),
      ).rejects.toThrow(new NotFoundException(EUnitErrors.UNITS_NOT_FOUND));
    });
  });

  describe('retrivePendingUnitsScore', () => {
    it('should return pending units score list when found', async () => {
      repository.retrivePendingUnitsScore.mockResolvedValue([mockScoreHistory]);

      const result = await service.retrivePendingUnitsScore(
        unit.unitId,
        unit.tenantId,
      );

      expect(result).toEqual({
        message: EScoreHistorySuccess.RETRIVE_SCORE_HISTORYS,
        data: [mockScoreHistory],
      });
    });

    it('should throw NotFoundException when no pending scores are found', async () => {
      repository.retrivePendingUnitsScore.mockResolvedValue([]);

      await expect(
        service.retrivePendingUnitsScore(unit.unitId, unit.tenantId),
      ).rejects.toThrow(new NotFoundException(EScoreHistoryErrors.NOT_FOUND));
    });
  });

  describe('approveUnitScore', () => {
    it('should approve unit score successfully', async () => {
      repository.findOneScoreHistoryPending.mockResolvedValue(mockScoreHistory);
      repository.approveScoreHistory.mockResolvedValue();
      const expectedResponse: IResponse<null> = {
        message: EUnitSuccess.ADJUST_SCORE,
        data: null,
      };
      unitsService.adjustUnitScore.mockResolvedValue(expectedResponse);

      const result = await service.approveUnitScore(
        mockScoreHistory.id,
        unit.userId,
        unit.tenantId,
      );

      expect(result).toEqual(expectedResponse);
      expect(repository.approveScoreHistory).toHaveBeenCalledWith(
        mockScoreHistory.id,
        unit.tenantId,
        unit.userId,
      );
      expect(unitsService.adjustUnitScore).toHaveBeenCalledWith(
        mockScoreHistory.unitId,
        unit.tenantId,
        mockScoreHistory.score,
      );
    });

    it('should throw NotFoundException when score history is not found for approval', async () => {
      repository.findOneScoreHistoryPending.mockResolvedValue(null);

      await expect(
        service.approveUnitScore('invalid-id', unit.userId, unit.tenantId),
      ).rejects.toThrow(new NotFoundException(EScoreHistoryErrors.NOT_FOUND));
    });

    it('should throw BadRequestException when score history status is not pending', async () => {
      const approvedHistory: ScoreHistoryEntity = {
        ...mockScoreHistory,
        status: EScoreHistoryStatus.APPROVED,
      };
      repository.findOneScoreHistoryPending.mockResolvedValue(approvedHistory);

      await expect(
        service.approveUnitScore(
          mockScoreHistory.id,
          unit.userId,
          unit.tenantId,
        ),
      ).rejects.toThrow(
        new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE),
      );
    });
  });

  describe('rejectUnitScore', () => {
    it('should reject unit score successfully', async () => {
      repository.findOneScoreHistoryPending.mockResolvedValue(mockScoreHistory);
      repository.rejectScoreHistory.mockResolvedValue();

      const result = await service.rejectUnitScore(
        mockScoreHistory.id,
        unit.userId,
        unit.tenantId,
      );

      expect(result).toEqual({
        message: EScoreHistorySuccess.REQUEST_SCORE,
        data: null,
      });
      expect(repository.rejectScoreHistory).toHaveBeenCalledWith(
        mockScoreHistory.id,
        unit.tenantId,
        unit.userId,
      );
    });

    it('should throw NotFoundException when score history is not found for rejection', async () => {
      repository.findOneScoreHistoryPending.mockResolvedValue(null);

      await expect(
        service.rejectUnitScore('invalid-id', unit.userId, unit.tenantId),
      ).rejects.toThrow(new NotFoundException(EScoreHistoryErrors.NOT_FOUND));
    });

    it('should throw BadRequestException when score history status is not pending during rejection', async () => {
      const rejectedHistory: ScoreHistoryEntity = {
        ...mockScoreHistory,
        status: EScoreHistoryStatus.REJECTED,
      };
      repository.findOneScoreHistoryPending.mockResolvedValue(rejectedHistory);

      await expect(
        service.rejectUnitScore(
          mockScoreHistory.id,
          unit.userId,
          unit.tenantId,
        ),
      ).rejects.toThrow(
        new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE),
      );
    });
  });
});
