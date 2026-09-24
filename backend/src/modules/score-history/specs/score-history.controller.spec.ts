import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { ScoreHistoryDto } from '../dtos/adjust-score.dto';
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
  const response: IResponse<{ newScore: number }> = {
    message: EUnitSuccess.ADJUST_SCORE,
    data: {
      newScore: 1000,
    },
  };

  beforeEach(() => {
    service = {
      adjustUnitScore: jest.fn(),
    };

    controller = new ScoreHistoryController(service);
  });

  describe('adjustUnitScore', () => {
    it(`should return { message: ${EUnitSuccess.ADJUST_SCORE}, data: { newScore: number } } when the score is register success`, async () => {
      service.adjustUnitScore.mockResolvedValue(response);

      expect(
        await controller.adjustUnitScore(unit.unitId, unit.tenantId, dto),
      ).toEqual(response);
    });
  });
});
