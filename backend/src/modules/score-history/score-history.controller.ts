import { Controller, Inject } from '@nestjs/common';
import { IScoreHistoryController } from './interfaces/score-history.controller.interface copy';
import { IScoreHistoryService } from './interfaces/score-history.service.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { ScoreHistoryDto } from './dtos/adjust-score.dto';

@Controller('adjust-scores')
export class ScoreHistoryController implements IScoreHistoryController {
  constructor(
    @Inject('IScoreHistoryService')
    private readonly service: IScoreHistoryService,
  ) {}

  async adjustUnitScore(
    unitId: string,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>> {
    return await this.service.adjustUnitScore(unitId, tenantId, dto);
  }
}
