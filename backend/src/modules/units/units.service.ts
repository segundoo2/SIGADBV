import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { IUnitsService } from './interfaces/units.service.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { UnitEntity } from './entities/unit.entity';
import type { IUnitsRepository } from './interfaces/units.repository.interface';
import { EUnitSuccess } from '../../common/enum/unit/unit-success.enum';
import { EUnitErrors } from '../../common/enum/unit/unit-errors.enum';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService implements IUnitsService {
  constructor(
    @Inject('IUnitsRepository') private readonly repository: IUnitsRepository,
  ) {}

  async createUnit(
    dto: CreateUnitDto & { tenantId: string },
  ): Promise<IResponse<UnitEntity>> {
    if (await this.repository.findOneByUnitName(dto.name, dto.tenantId)) {
      throw new ConflictException(EUnitErrors.UNIT_CONFLICT);
    }

    const unitCreated = await this.repository.createUnit(dto);
    return {
      message: EUnitSuccess.CREATE,
      data: unitCreated,
    };
  }

  async findOneByUnitName(
    unitName: string,
    tenantId: string,
  ): Promise<IResponse<UnitEntity>> {
    const unit = await this.repository.findOneByUnitName(unitName, tenantId);

    if (!unit) {
      throw new NotFoundException(EUnitErrors.UNIT_NOT_FOUND);
    }

    return {
      message: EUnitSuccess.FINDONE,
      data: unit,
    };
  }

  async findAllUnits(tenantId: string): Promise<IResponse<UnitEntity[]>> {
    const units = await this.repository.findAllUnits(tenantId);

    if (units.length === 0) {
      throw new NotFoundException(EUnitErrors.UNITS_NOT_FOUND);
    }

    return {
      message: EUnitSuccess.FIND,
      data: units,
    };
  }

  async updateUnit(
    id: string,
    dto: UpdateUnitDto & { tenantId: string },
  ): Promise<IResponse<null>> {
    const unitUpdated = await this.repository.updateUnit(id, dto);

    if (unitUpdated.affected === 0) {
      throw new NotFoundException(EUnitErrors.UNIT_NOT_FOUND);
    }

    return {
      message: EUnitSuccess.UPDATE,
      data: null,
    };
  }

  async deleteUnit(id: string, tenantId: string): Promise<IResponse<null>> {
    const unitDeleted = await this.repository.deleteUnit(id, tenantId);

    if (unitDeleted.affected === 0) {
      throw new NotFoundException(EUnitErrors.UNIT_NOT_FOUND);
    }

    return {
      message: EUnitSuccess.DELETE,
      data: null,
    };
  }
}
