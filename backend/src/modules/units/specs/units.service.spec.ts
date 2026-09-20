/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException } from '@nestjs/common';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';
import { IUnitsRepository } from '../interfaces/units.repository.interface';
import { UnitsService } from '../units.service';
import { EUnitErrors } from '../../../common/enum/unit/unit-errors.enum';

describe('UnitService', () => {
  let service: UnitsService;
  let repository: jest.Mocked<IUnitsRepository>;

  beforeEach(() => {
    repository = {
      createUnit: jest.fn(),
      findOneByUnitName: jest.fn(),
    };

    service = new UnitsService(repository);
  });

  const unit: UnitEntity = {
    id: 'uuid',
    tenantId: 'uuid-club',
    name: 'Gavião-Real',
    gender: EUnitGender.FEMALE,
    totalPoints: 10000,
    maxMembers: 6,
    members: ['ed'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createUnit', () => {
    const response: IResponse<UnitEntity> = {
      message: EUnitSuccess.CREATE,
      data: unit,
    };

    const createUnitDto: CreateUnitDto = {
      name: 'Gavião-Real',
      gender: EUnitGender.FEMALE,
      maxMembers: 6,
    };

    it(`should return object { message: ${EUnitSuccess.CREATE} }`, async () => {
      repository.createUnit.mockResolvedValue(unit);
      repository.findOneByUnitName.mockResolvedValue(null);
      expect(
        await service.createUnit({ ...createUnitDto, tenantId: unit.tenantId }),
      ).toEqual(response);
      expect(repository.createUnit).toHaveBeenCalledWith({
        ...createUnitDto,
        tenantId: unit.tenantId,
      });
    });

    it('should return ConflictException when unitName found in the database', async () => {
      repository.findOneByUnitName.mockResolvedValue(unit);
      await expect(
        service.createUnit({ ...createUnitDto, tenantId: unit.id }),
      ).rejects.toThrow(new ConflictException(EUnitErrors.UNIT_CONFLICT));
    });
  });
});
