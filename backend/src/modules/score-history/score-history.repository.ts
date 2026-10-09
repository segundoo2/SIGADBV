import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IScoreHistoryRepository } from './interfaces/score-history.repository.interface';
import { EErrorsGlobal } from '../../common/enum/global/errors-global.enum';
import { ScoreHistoryDto } from './dtos/score-history.dto';
import { ScoreHistoryEntity } from './entity/score-history.entity';
import { UnitEntity } from '../units/entities/unit.entity';
import { EScoreHistoryStatus } from '../../common/enum/score-story/score-history-status.enum';

@Injectable()
export class ScoreHistoryRepository implements IScoreHistoryRepository {
  constructor(
    @InjectRepository(ScoreHistoryEntity)
    private readonly repository: Repository<ScoreHistoryEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
  ) {}

  async requestAdjustUnitScore(
    dto: ScoreHistoryDto & {
      unitId: string;
      tenantId: string;
      requestedById: string;
      status: EScoreHistoryStatus;
    },
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
    limit?: number,
  ): Promise<ScoreHistoryEntity[]> {
    try {
      return await this.repository.find({
        where: { unitId, tenantId },
        order: { createdAt: 'DESC' },
        take: limit ? Number(limit) : undefined,
        relations: { requestedBy: true, approvedBy: true, rejectedBy: true },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllUnitsNameAndId(
    tenantId: string,
  ): Promise<Pick<UnitEntity, 'id' | 'name'>[]> {
    try {
      return await this.unitRepository.find({
        where: { tenantId },
        select: { id: true, name: true },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async retrivePendingUnitsScore(
    tenantId: string,
  ): Promise<ScoreHistoryEntity[]> {
    try {
      return await this.repository.find({
        where: {
          tenantId,
          status: EScoreHistoryStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
        relations: { requestedBy: true, unit: true },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findOneScoreHistoryPending(
    id: string,
    tenantId: string,
  ): Promise<ScoreHistoryEntity | null> {
    try {
      return await this.repository.findOne({
        where: { id, tenantId },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async approveScoreHistory(
    id: string,
    tenantId: string,
    approvedById: string,
  ): Promise<void> {
    try {
      await this.repository.update(
        { id, tenantId },
        { status: EScoreHistoryStatus.APPROVED, approvedById },
      );
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async rejectScoreHistory(
    id: string,
    tenantId: string,
    rejectedById: string,
  ): Promise<void> {
    try {
      await this.repository.update(
        { id, tenantId },
        { status: EScoreHistoryStatus.REJECTED, rejectedById },
      );
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
