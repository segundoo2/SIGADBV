import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { IUnitsService } from '../../units/interfaces/units.service.interface';
import { ScoreHistoryService } from '../score-history.service';
import { IScoreHistoryRepository } from '../interfaces/scores-history.repository.interface';
import { ScoreHistoryDto } from '../dtos/adjust-score.dto';

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
  const response: IResponse<{ newScore: number }> = {
    message: EUnitSuccess.ADJUST_SCORE,
    data: {
      newScore: 1000,
    },
  };

  beforeEach(() => {
    repository = {
      adjustUnitScore: jest.fn(),
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
      unitsService.adjustUnitScore.mockResolvedValue(response);

      expect(
        await service.adjustUnitScore(unit.unitId, unit.tenantId, dto),
      ).toEqual(response);
    });

    it('should register score in entity when the score registred with success', async () => {
      repository.adjustUnitScore.mockResolvedValue();
      unitsService.adjustUnitScore.mockResolvedValue(response);
      expect(
        await service.adjustUnitScore(unit.unitId, unit.tenantId, dto),
      ).toEqual(response);
    });
  });
});
