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
import { IJwtPayloadWithExpiry } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ScoreHistoryService implements IScoreHistoryService {
  constructor(
    @Inject('IScoreHistoryRepository')
    private readonly repository: IScoreHistoryRepository,
    @Inject('IUnitsService')
    private readonly unitsService: IUnitsService,
  ) {}

  async findAllHistoryScorePending(
    tenantId: string,
  ): Promise<IResponse<ScoreHistoryEntity[]>> {
    const list = await this.repository.findAllHistoryScorePending(tenantId);

    return {
      message: EScoreHistorySuccess.FIND,
      data: list,
    };
  }

  async adjustUnitScore(
    unitId: string,
    currentUser: string,
    tenantId: string,
    dto: ScoreHistoryDto,
  ): Promise<IResponse<{ newScore: number }>> {
    await this.repository.adjustUnitScore({
      unitId,
      currentUser,
      tenantId,
      ...dto,
    });

    return {
      message: EScoreHistorySuccess.FIND,
      data: { newScore: 0 },
    };
  }

  async approveScore(
    scoreHistoryId: string,
    tenantId: string,
    currentUser: IJwtPayloadWithExpiry,
  ): Promise<IResponse<null>> {
    const pendingItems =
      await this.repository.findAllHistoryScorePending(tenantId);
    const item = pendingItems.find((h) => h.id === scoreHistoryId);

    if (!item) {
      throw new NotFoundException(EScoreHistoryErrors.NOT_FOUND);
    }

    if (item.isApproved) {
      throw new BadRequestException('Esta pontuação já foi aprovada.');
    }

    await this.unitsService.adjustUnitScore(item.unitId, tenantId, item.score);

    await this.repository.approveScore(scoreHistoryId, tenantId, currentUser);

    return {
      message: EScoreHistorySuccess.APPROVE,
      data: null,
    };
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
}
