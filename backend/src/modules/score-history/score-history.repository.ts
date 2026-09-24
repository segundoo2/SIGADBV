import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IScoreHistoryRepository } from './interfaces/scores-history.repository.interface';
import { EErrorsGlobal } from '../../common/enum/global/errors-global.enum';
import { ScoreHistoryDto } from './dtos/adjust-score.dto';
import { ScoreHistoryEntity } from './entity/score-history.entity';

@Injectable()
export class ScoreHistoryRepository implements IScoreHistoryRepository {
  constructor(
    @InjectRepository(ScoreHistoryEntity)
    private readonly repository: Repository<ScoreHistoryEntity>,
  ) {}

  async adjustUnitScore(
    dto: ScoreHistoryDto & { unitId: string; tenantId: string },
  ): Promise<void> {
    try {
      const entity = this.repository.create(dto);
      await this.repository.save(entity);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findHistoryByUnitId(
    unitId: string,
    tenantId: string,
  ): Promise<ScoreHistoryEntity> {
    try {
      return await this.repository.findOne({ where: { unitId, tenantId } });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
