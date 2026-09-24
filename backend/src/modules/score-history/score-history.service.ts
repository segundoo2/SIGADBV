import { Inject, Injectable } from '@nestjs/common';
import { IScoreHistoryService } from './interfaces/score-history.service.interface';
import { IScoreHistoryRepository } from './interfaces/scores-history.repository.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { IUnitsService } from '../units/interfaces/units.service.interface';
import { ScoreHistoryDto } from './dtos/adjust-score.dto';

@Injectable()
export class ScoreHistoryService implements IScoreHistoryService {
  constructor(
    @Inject('IScoreHistoryRepository')
    private readonly repositoroy: IScoreHistoryRepository,
    @Inject('IUnitsService')
    private readonly unitsService: IUnitsService,
  ) {}

  async adjustUnitScore(
    unitId: string,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>> {
    const response = await this.unitsService.adjustUnitScore(
      unitId,
      tenantId,
      dto.score,
    );
    await this.repositoroy.adjustUnitScore({ unitId, tenantId, ...dto });

    return response;
  }
}
