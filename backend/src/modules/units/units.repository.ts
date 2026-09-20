import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UnitEntity } from './entities/unit.entity';
import { IUnitsRepository } from './interfaces/units.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EErrorsGlobal } from '../../common/enum/global/errors-global.enum';

@Injectable()
export class UnitsRepository implements IUnitsRepository {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly repository: Repository<UnitEntity>,
  ) {}

  async createUnit(
    dto: CreateUnitDto & { tenantId: string },
  ): Promise<UnitEntity> {
    try {
      const unit = this.repository.create(dto);
      return await this.repository.save(unit);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findOneByUnitName(
    unitName: string,
    tenantId: string,
  ): Promise<UnitEntity | null> {
    try {
      return await this.repository.findOne({
        where: { name: unitName, tenantId },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
