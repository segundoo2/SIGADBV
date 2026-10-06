import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IScoreHistoryRepository } from './interfaces/score-history.repository.interface';
import { EErrorsGlobal } from '../../common/enum/global/errors-global.enum';
import { ScoreHistoryDto } from './dtos/score-history.dto';
import { ScoreHistoryEntity } from './entity/score-history.entity';
import { IJwtPayloadWithExpiry } from '../auth/interfaces/jwt-payload.interface';

@Injectable()
export class ScoreHistoryRepository implements IScoreHistoryRepository {
  constructor(
    @InjectRepository(ScoreHistoryEntity)
    private readonly repository: Repository<ScoreHistoryEntity>,
  ) {}

  async adjustUnitScore(
    dto: ScoreHistoryDto & {
      unitId: string;
      currentUser: string;
      tenantId: string;
    },
  ): Promise<void> {
    try {
      const entity = this.repository.create({
        ...dto,
        createdById: dto.currentUser,
        isApproved: false,
      });
      await this.repository.save(entity);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllHistoryScorePending(
    tenantId: string,
  ): Promise<ScoreHistoryEntity[]> {
    try {
      return await this.repository.find({
        where: { tenantId, isApproved: false },
        relations: {
          createdBy: true,
          unit: true,
        },
        order: { createdAt: 'ASC' },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async approveScore(
    scoreHistoryId: string,
    tenantId: string,
    currentUser: IJwtPayloadWithExpiry,
  ): Promise<void> {
    try {
      await this.repository.update(
        { id: scoreHistoryId, tenantId },
        {
          isApproved: true,
          approvedById: currentUser.sub,
        },
      );
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findHistoryByUnitId(
    unitId: string,
    tenantId: string,
    limit?: number,
  ): Promise<ScoreHistoryEntity[]> {
    try {
      return await this.repository.find({
        where: { unitId, tenantId },
        order: { createdAt: 'DESC' },
        take: limit ? Number(limit) : undefined,
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
