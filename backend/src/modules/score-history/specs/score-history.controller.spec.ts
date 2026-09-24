import { EScoreHistorySuccess } from '../../../common/enum/score-story/score-history-success.enum';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ScoreHistoryDto } from '../dtos/score-history.dto';
import { ScoreHistoryEntity } from '../entity/score-history.entity';
import { IScoreHistoryService } from '../interfaces/score-history.service.interface';
import { ScoreHistoryController } from '../score-history.controller';

describe('ScoreHistoryController', () => {
  let controller: ScoreHistoryController;
  let service: jest.Mocked<IScoreHistoryService>;
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
    service = {
      adjustUnitScore: jest.fn(),
      findHistoryByUnitId: jest.fn(),
    };

    controller = new ScoreHistoryController(service);
  });

  describe('adjustUnitScore', () => {
    it(`should return { message: ${EUnitSuccess.ADJUST_SCORE}, data: { newScore: number } } when the score is register success`, async () => {
      service.adjustUnitScore.mockResolvedValue(
        response as IResponse<{ newScore: number }>,
      );

      expect(
        await controller.adjustUnitScore(unit.unitId, unit.tenantId, dto),
      ).toEqual(response);
    });
  });

  describe('findHistoryByUnitId', () => {
    response.data = mockScoreHistory;

    it(`should return { ${EScoreHistorySuccess.FIND} } when the score history is found with success`, async () => {
      service.findHistoryByUnitId.mockResolvedValue(
        response as IResponse<ScoreHistoryEntity>,
      );

      expect(
        await controller.findHistoryByUnitId(unit.unitId, unit.tenantId),
      ).toEqual(response);
    });
  });
});
