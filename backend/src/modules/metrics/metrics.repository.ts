import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { IMetricsRepository } from './interfaces/metrics.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { UnitEntity } from '../units/entities/unit.entity';
import { Repository } from 'typeorm';
import { EErrorsGlobal } from '../../common/enum/global/errors-global.enum';

@Injectable()
export class MetricsRepository implements IMetricsRepository {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly repository: Repository<UnitEntity>,
  ) {}

  async findListScoreUnits(
    tenantId: string,
  ): Promise<{ name: string; score: number }[] | []> {
    try {
      return await this.repository.find({
        where: { tenantId },
        select: {
          name: true,
          score: true,
        },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
