import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IScoreHistoryService } from './interfaces/score-history.service.interface';
import { IScoreHistoryRepository } from './interfaces/score-history.repository.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { IUnitsService } from '../units/interfaces/units.service.interface';
import { ScoreHistoryDto } from './dtos/score-history.dto';
import { ScoreHistoryEntity } from './entity/score-history.entity';
import { EScoreHistorySuccess } from '../../common/enum/score-story/score-history-success.enum';
import { EScoreHistoryErrors } from '../../common/enum/score-story/score-history-errors.enum';

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

  async findHistoryByUnitId(
    unitId: string,
    tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity>> {
    const scoreHistory = await this.repositoroy.findHistoryByUnitId(
      unitId,
      tenantId,
    );

    if (!scoreHistory) {
      throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
    }

    return {
      message: EScoreHistorySuccess.FIND,
      data: scoreHistory,
    };
  }
}
