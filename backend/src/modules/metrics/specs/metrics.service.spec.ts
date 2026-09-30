import { NotFoundException } from '@nestjs/common';
import { EMetricsSuccess } from '../../../common/enum/metrics/metrics-success.enum';
import { IMetricsRepository } from '../interfaces/metrics.repository.interface';
import { MetricsService } from '../metrics.service';
import { EMetricsErrors } from '../../../common/enum/metrics/metrics-errors.enum';

describe('MetricsService', () => {
  let service: MetricsService;
  let repository: jest.Mocked<IMetricsRepository>;

  beforeEach(() => {
    repository = {
      findListScoreUnits: jest.fn(),
    };

    service = new MetricsService(repository);
  });

  describe('findListScoreUnits', () => {
    const response = {
      message: EMetricsSuccess.FIND_LIST_SCORE,
      data: [{ name: 'unit', value: 100 }],
    };

    it('should return [{ name: string, value: number }] when the find is a success', async () => {
      repository.findListScoreUnits.mockResolvedValue([
        { name: 'unit', score: 100 },
      ]);
      expect(await service.findListScoreUnits('uuid-tenant')).toEqual(response);
    });

    it('should return NotFoundException when the list is empty', async () => {
      repository.findListScoreUnits.mockResolvedValue([]);
      await expect(service.findListScoreUnits('uuid-tenant')).rejects.toThrow(
        new NotFoundException(EMetricsErrors.NOT_FOUND_LIST),
      );
    });

    it('should return NotFoundException when the list is null', async () => {
      repository.findListScoreUnits.mockResolvedValue(null);
      await expect(service.findListScoreUnits('uuid-tenant')).rejects.toThrow(
        new NotFoundException(EMetricsErrors.NOT_FOUND_LIST),
      );
    });
  });
});
