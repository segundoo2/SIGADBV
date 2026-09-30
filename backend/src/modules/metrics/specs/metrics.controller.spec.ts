import { EMetricsSuccess } from '../../../common/enum/metrics/metrics-success.enum';
import { IMetricsService } from '../interfaces/metrics.service.interface';
import { MetricsController } from '../metrics.controller';

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: jest.Mocked<IMetricsService>;

  beforeEach(() => {
    service = {
      findListScoreUnits: jest.fn(),
    };

    controller = new MetricsController(service);
  });

  describe('findListScoreUnits', () => {
    const response = {
      message: EMetricsSuccess.FIND_LIST_SCORE,
      data: [{ name: 'unit', value: 100 }],
    };

    it('should return [{ name: string, value: number }] when the find is a success', async () => {
      service.findListScoreUnits.mockResolvedValue(response);
      expect(await controller.findListScoreUnits('uuid-tenant')).toEqual(
        response,
      );
    });
  });
});
