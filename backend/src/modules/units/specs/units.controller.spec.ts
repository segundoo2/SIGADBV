/* eslint-disable @typescript-eslint/unbound-method */
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UpdateUnitDto } from '../dto/update-unit.dto';
import { UnitEntity } from '../entities/unit.entity';
import { IUnitsService } from '../interfaces/units.service.interface';
import { UnitsController } from '../units.controller';

describe('UnitController', () => {
  let controller: UnitsController;
  let service: jest.Mocked<IUnitsService>;

  beforeEach(() => {
    service = {
      createUnit: jest.fn(),
      findOneByUnitName: jest.fn(),
      findAllUnits: jest.fn(),
      updateUnit: jest.fn(),
      adjustUnitScore: jest.fn(),
      deleteUnit: jest.fn(),
    };

    controller = new UnitsController(service);
  });

  const unit: UnitEntity = {
    id: 'uuid',
    tenantId: 'uuid-club',
    name: 'Gavião-Real',
    gender: EUnitGender.FEMALE,
    score: 10000,
    maxMembers: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
    scoreHistories: [],
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

  describe('findOneByUnitName', () => {
    const response: IResponse<UnitEntity> = {
      message: EUnitSuccess.FINDONE,
      data: unit,
    };

    it('should return unit entity when she is found', async () => {
      service.findOneByUnitName.mockResolvedValue(response);
      expect(
        await controller.findOneByUnitName(unit.name, unit.tenantId),
      ).toEqual(response);
    });
  });

  describe('findAllUnits', () => {
    const response: IResponse<UnitEntity[] | []> = {
      message: EUnitSuccess.FIND,
      data: [unit],
    };

    it('should return all units when she is found', async () => {
      service.findAllUnits.mockResolvedValue(response);
      expect(await controller.findAllUnits(unit.tenantId)).toEqual(response);
    });
  });

  describe('updateUnit', () => {
    const updateUnitDto: UpdateUnitDto = {
      name: 'test',
      gender: EUnitGender.MALE,
      maxMembers: 10,
    };

    it(`should return { message: ${EUnitSuccess.UPDATE}, data: null } when the unit is update with success`, async () => {
      const response = {
        message: EUnitSuccess.UPDATE,
        data: null,
      };
      service.updateUnit.mockResolvedValue(response);
      expect(
        await controller.updateUnit(unit.id, updateUnitDto, unit.tenantId),
      ).toEqual(response);
    });
  });

  describe('deleteUnit', () => {
    it(`should return { message: ${EUnitSuccess.DELETE}, data: null } when the unit is deleted success`, async () => {
      service.deleteUnit.mockResolvedValue({
        message: EUnitSuccess.DELETE,
        data: null,
      });

      expect(await controller.deleteUnit(unit.id, unit.tenantId)).toEqual({
        message: EUnitSuccess.DELETE,
        data: null,
      });
    });
  });
});
