import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { IUnitsService } from './interfaces/units.service.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { UnitEntity } from './entities/unit.entity';
import type { IUnitsRepository } from './interfaces/units.repository.interface';
import { EUnitSuccess } from '../../common/enum/unit/unit-success.enum';
import { EUnitErrors } from '../../common/enum/unit/unit-errors.enum';

@Injectable()
export class UnitsService implements IUnitsService {
  constructor(
    @Inject('IUnitsRepository') private readonly repository: IUnitsRepository,
  ) {}

  async createUnit(
    dto: CreateUnitDto & { tenantId: string },
  ): Promise<IResponse<UnitEntity>> {
    if (await this.repository.findOneByUnitName(dto.name)) {
      throw new ConflictException(EUnitErrors.UNIT_CONFLICT);
    }

    const unitCreated = await this.repository.createUnit(dto);
    return {
      message: EUnitSuccess.CREATE,
      data: unitCreated,
    };
  }
}
