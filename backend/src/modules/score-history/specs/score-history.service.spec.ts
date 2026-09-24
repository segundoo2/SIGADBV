import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { IUnitsService } from '../../units/interfaces/units.service.interface';
import { ScoreHistoryService } from '../score-history.service';
import { IScoreHistoryRepository } from '../interfaces/scores-history.repository.interface';
import { ScoreHistoryDto } from '../dtos/adjust-score.dto';
import { EScoreHistorySuccess } from '../../../common/enum/score-story/score-history-success.enum';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { NotFoundException } from '@nestjs/common';
import { EScoreHistoryErrors } from '../../../common/enum/score-story/score-history-errors.enum';

describe('ScoreHistoryService', () => {
  let service: ScoreHistoryService;
  let repository: jest.Mocked<IScoreHistoryRepository>;
  let unitsService: jest.Mocked<Partial<IUnitsService>>;
  const dto: ScoreHistoryDto = {
    score: 100,
    description: 'Prova x',
  };
  const unit = {
    unitId: 'uuid',
    tenantId: 'uuid-tenant',
  };
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
  const response: IResponse<{ newScore: number } | ScoreHistoryEntity> = {
    message: EUnitSuccess.ADJUST_SCORE,
    data: {
      newScore: 1000,
    },
  };

  beforeEach(() => {
    repository = {
      adjustUnitScore: jest.fn(),
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
    it(`should return { message: ${EUnitSuccess.ADJUST_SCORE}, data: { newScore: number } } when the score is registred success`, async () => {
      repository.adjustUnitScore.mockResolvedValue();
      unitsService.adjustUnitScore.mockResolvedValue(
        response as IResponse<{ newScore: number }>,
      );

      expect(
        await service.adjustUnitScore(unit.unitId, unit.tenantId, dto),
      ).toEqual(response);
    });

    it('should register score in entity when the score registred with success', async () => {
      repository.adjustUnitScore.mockResolvedValue();
      unitsService.adjustUnitScore.mockResolvedValue(
        response as IResponse<{ newScore: number }>,
      );
      expect(
        await service.adjustUnitScore(unit.unitId, unit.tenantId, dto),
      ).toEqual(response);
    });
  });

  describe('findHistoryByUnitId', () => {
    response.message = EScoreHistorySuccess.FIND;
    response.data = mockScoreHistory;

    it(`should return { ${EScoreHistorySuccess.FIND} } when the score history is found with success`, async () => {
      repository.findHistoryByUnitId.mockResolvedValue(mockScoreHistory);

      expect(
        await service.findHistoryByUnitId(unit.unitId, unit.tenantId),
      ).toEqual(response);
    });

    it('should return NotFoundException when score history is not found', async () => {
      repository.findHistoryByUnitId.mockResolvedValue(null);
      await expect(
        service.findHistoryByUnitId(unit.unitId, unit.tenantId),
      ).rejects.toThrow(new NotFoundException(EScoreHistoryErrors.NOT_FOUND));
    });
  });
});
