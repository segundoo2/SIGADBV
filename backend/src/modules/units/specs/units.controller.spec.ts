/* eslint-disable @typescript-eslint/unbound-method */
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';
import { IUnitsService } from '../interfaces/units.service.interface';
import { UnitsController } from '../units.controller';

describe('UnitController', () => {
  let controller: UnitsController;
  let service: jest.Mocked<IUnitsService>;

  beforeEach(() => {
    service = {
      createUnit: jest.fn(),
    };

    controller = new UnitsController(service);
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
      service.createUnit.mockResolvedValue(response);
      expect(await controller.createUnit(createUnitDto, unit.tenantId)).toEqual(
        response,
      );
      expect(service.createUnit).toHaveBeenCalledWith({
        ...createUnitDto,
        tenantId: unit.tenantId,
      });
    });
  });
});
