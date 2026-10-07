import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IScoreHistoryService } from './interfaces/score-history.service.interface';
import { IScoreHistoryRepository } from './interfaces/score-history.repository.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { IUnitsService } from '../units/interfaces/units.service.interface';
import { ScoreHistoryDto } from './dtos/score-history.dto';
import { ScoreHistoryEntity } from './entity/score-history.entity';
import { EScoreHistorySuccess } from '../../common/enum/score-story/score-history-success.enum';
import { EScoreHistoryErrors } from '../../common/enum/score-story/score-history-errors.enum';
import { UnitEntity } from '../units/entities/unit.entity';
import { EUnitErrors } from '../../common/enum/unit/unit-errors.enum';
import { EUnitSuccess } from '../../common/enum/unit/unit-success.enum';
import { EScoreHistoryStatus } from '../../common/enum/score-story/score-history-status.enum';

@Injectable()
export class ScoreHistoryService implements IScoreHistoryService {
  constructor(
    @Inject('IScoreHistoryRepository')
    private readonly repository: IScoreHistoryRepository,
    @Inject('IUnitsService')
    private readonly unitsService: IUnitsService,
  ) {}

  async requestAdjustUnitScore(
    unitId: string,
    userId: string,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<null>> {
    await this.repository.requestAdjustUnitScore({
      unitId,
      requestedById: userId,
      tenantId,
      status: EScoreHistoryStatus.PENDING,
      ...dto,
    });

    return { message: EScoreHistorySuccess.REQUEST_SCORE, data: null };
  }

  async findHistoryByUnitId(
    unitId: string,
    tenantId: string,
    limit?: number,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    const scoreHistory = await this.repository.findHistoryByUnitId(
      unitId,
      tenantId,
      limit,
    );

    if (!scoreHistory) {
      throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
    }

    return {
      message: EScoreHistorySuccess.FIND,
      data: scoreHistory,
    };
  }

  async findAllUnitsNameAndId(
    tenantId: string,
  ): Promise<IResponse<Pick<UnitEntity, 'id' | 'name'>[]>> {
    const units = await this.repository.findAllUnitsNameAndId(tenantId);

    if (units.length === 0) {
      throw new NotFoundException(EUnitErrors.UNITS_NOT_FOUND);
    }

    return {
      message: EUnitSuccess.FIND,
      data: units,
    };
  }

  async retrivePendingUnitsScore(
    unitId: string,
    tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    const scoresPeding = await this.repository.retrivePendingUnitsScore(
      unitId,
      tenantId,
    );

    if (scoresPeding.length === 0) {
      throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
    }

    return {
      message: EScoreHistorySuccess.RETRIVE_SCORE_HISTORYS,
      data: scoresPeding,
    };
  }

  async approveUnitScore(
    scoreHistoryId: string,
    userId: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    const scorePending = await this.repository.findOneScoreHistoryPending(
      scoreHistoryId,
      tenantId,
    );

    if (scorePending === null) {
      throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
    }

    if (scorePending.status !== EScoreHistoryStatus.PENDING) {
      throw new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE);
    }

    await this.repository.approveScoreHistory(scoreHistoryId, tenantId, userId);

    const response = await this.unitsService.adjustUnitScore(
      scorePending.unitId,
      tenantId,
      scorePending.score,
    );

    return response;
  }

  async rejectUnitScore(
    scoreHistoryId: string,
    userId: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    const scorePending = await this.repository.findOneScoreHistoryPending(
      scoreHistoryId,
      tenantId,
    );

    if (scorePending === null) {
      throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
    }

    if (scorePending.status !== EScoreHistoryStatus.PENDING) {
      throw new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE);
    }

    await this.repository.rejectScoreHistory(scoreHistoryId, tenantId, userId);

    return {
      message: EScoreHistorySuccess.REQUEST_SCORE,
      data: null,
    };
  }
}
