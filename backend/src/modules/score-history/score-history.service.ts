import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
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
import { DataSource } from 'typeorm';

@Injectable()
export class ScoreHistoryService implements IScoreHistoryService {
  constructor(
    @Inject('IScoreHistoryRepository')
    private readonly repository: IScoreHistoryRepository,
    @Inject('IUnitsService')
    private readonly unitsService: IUnitsService,
    private readonly dataSource: DataSource,
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
    tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    const scores = await this.repository.retrivePendingUnitsScore(tenantId);

    if (scores.length === 0) {
      throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
    }

    return {
      message: EScoreHistorySuccess.RETRIVE_SCORE_HISTORYS,
      data: scores,
    };
  }

  async approveUnitScore(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.dataSource.transaction(async (manager) => {
      const scoreHistory = await this.repository.findOneScoreHistoryForUpdate(
        id,
        tenantId,
        manager,
      );

      if (!scoreHistory) {
        throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
      }

      if (scoreHistory.status !== EScoreHistoryStatus.PENDING) {
        throw new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE);
      }

      const response = await this.unitsService.adjustUnitScore(
        scoreHistory.unitId,
        tenantId,
        scoreHistory.score,
        manager,
      );

      const result = await this.repository.approveScoreHistory(
        id,
        tenantId,
        userId,
        manager,
      );

      if (result.affected !== 1) {
        throw new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE);
      }

      return response;
    });
  }

  async rejectUnitScore(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.dataSource.transaction(async (manager) => {
      const scoreHistory = await this.repository.findOneScoreHistoryForUpdate(
        id,
        tenantId,
        manager,
      );

      if (!scoreHistory) {
        throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
      }

      if (scoreHistory.status !== EScoreHistoryStatus.PENDING) {
        throw new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE);
      }

      const result = await this.repository.rejectScoreHistory(
        id,
        tenantId,
        userId,
        manager,
      );

      if (result.affected !== 1) {
        throw new BadRequestException(EScoreHistoryErrors.SCORE_APPROVE);
      }

      return {
        message: EScoreHistorySuccess.REQUEST_SCORE,
        data: null,
      };
    });
  }
}
