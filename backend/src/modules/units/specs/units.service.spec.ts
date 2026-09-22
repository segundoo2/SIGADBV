/* eslint-disable @typescript-eslint/unbound-method */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UnitsService } from '../units.service';
import type { IUnitsRepository } from '../interfaces/units.repository.interface';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';
import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { EUnitSuccess } from '../../../common/enum/unit/unit-success.enum';
import { EUnitErrors } from '../../../common/enum/unit/unit-errors.enum';
import { DeleteResult, UpdateResult } from 'typeorm';
import { UpdateUnitDto } from '../dto/update-unit.dto';

describe('UnitsService', () => {
  let service: UnitsService;
  let repositoryMock: jest.Mocked<IUnitsRepository>;

  const unit: UnitEntity = {
    id: 'uuid',
    tenantId: 'uuid-club',
    name: 'Gavião-Real',
    gender: EUnitGender.FEMALE,
    score: 10000,
    maxMembers: 6,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createUnitDto: CreateUnitDto & { tenantId: string } = {
    tenantId: 'uuid-club',
    name: 'Gavião-Real',
    gender: EUnitGender.FEMALE,
    maxMembers: 6,
  };

  beforeEach(() => {
    repositoryMock = {
      createUnit: jest.fn(),
      findOneByUnitName: jest.fn(),
      findOneScoreById: jest.fn(),
      findAllUnits: jest.fn(),
      updateUnit: jest.fn(),
      adjustUnitScore: jest.fn(),
      deleteUnit: jest.fn(),
    };

    service = new UnitsService(repositoryMock);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('createUnit', () => {
    it('should return unit entity when she is created with success', async () => {
      repositoryMock.findOneByUnitName?.mockResolvedValue(null);
      repositoryMock.createUnit?.mockResolvedValue(unit);

      const result = await service.createUnit(createUnitDto);

      expect(result).toEqual({
        message: EUnitSuccess.CREATE,
        data: unit,
      });
      expect(repositoryMock.findOneByUnitName).toHaveBeenCalledWith(
        createUnitDto.name,
        createUnitDto.tenantId,
      );
      expect(repositoryMock.createUnit).toHaveBeenCalledWith(createUnitDto);
    });

    it('should throw ConflictException when unit name already exists', async () => {
      repositoryMock.findOneByUnitName?.mockResolvedValue(unit);

      await expect(service.createUnit(createUnitDto)).rejects.toThrow(
        new ConflictException(EUnitErrors.UNIT_CONFLICT),
      );

      expect(repositoryMock.createUnit).not.toHaveBeenCalled();
    });
  });

  describe('findOneByUnitName', () => {
    it(`should return {message: ${EUnitSuccess.FINDONE}, data: UnitEntity } when unit entity is found`, async () => {
      repositoryMock.findOneByUnitName.mockResolvedValue(unit);
      expect(await service.findOneByUnitName(unit.name, unit.tenantId)).toEqual(
        {
          message: EUnitSuccess.FINDONE,
          data: unit,
        },
      );
    });

    it('should return NotFoundException when the unit is not found', async () => {
      repositoryMock.findOneByUnitName.mockResolvedValue(null);
      await expect(
        service.findOneByUnitName(unit.name, unit.tenantId),
      ).rejects.toThrow(new NotFoundException(EUnitErrors.UNIT_NOT_FOUND));
    });
  });

  describe('findAllUnits', () => {
    it('should return all units when she is found', async () => {
      repositoryMock.findAllUnits.mockResolvedValue([unit]);
      expect(await service.findAllUnits(unit.tenantId)).toEqual({
        message: EUnitSuccess.FIND,
        data: [unit],
      });
    });

    it('should return NotFoundException when units list not found', async () => {
      repositoryMock.findAllUnits.mockResolvedValue([]);
      await expect(service.findAllUnits(unit.tenantId)).rejects.toThrow(
        new NotFoundException(EUnitErrors.UNITS_NOT_FOUND),
      );
    });
  });

  describe('updateUnit', () => {
    const updateUnitDto: UpdateUnitDto = {
      name: 'test',
      gender: EUnitGender.MALE,
      maxMembers: 10,
    };

    const response: UpdateResult = {
      raw: 0,
      generatedMaps: [],
      affected: 1,
    };

    it(`should return { message: ${EUnitSuccess.UPDATE}, data: null } when the unit is update with success`, async () => {
      repositoryMock.updateUnit.mockResolvedValue(response);
      expect(
        await service.updateUnit(unit.id, {
          ...updateUnitDto,
          tenantId: unit.tenantId,
        }),
      ).toEqual({ message: EUnitSuccess.UPDATE, data: null });
    });

    it('should return NotFoundException when the unit not found', async () => {
      response.affected = 0;
      repositoryMock.updateUnit.mockResolvedValue(response);
      await expect(
        service.updateUnit(unit.id, {
          ...updateUnitDto,
          tenantId: unit.tenantId,
        }),
      ).rejects.toThrow(new NotFoundException(EUnitErrors.UNIT_NOT_FOUND));
    });
  });

  describe('adjustUnitScore', () => {
    it(`should return new unit score when score is adujusted with success`, async () => {
      const newScore = unit.score + unit.score;
      repositoryMock.findOneScoreById.mockResolvedValue(newScore);
      expect(
        await service.adjustUnitScore(unit.id, unit.tenantId, unit.score),
      ).toEqual({
        message: EUnitSuccess.ADJUST_SCORE,
        data: {
          newScore: newScore,
        },
      });
    });

    it('should return NotFoundException when unit not found', async () => {
      repositoryMock.findOneScoreById.mockResolvedValue(null);
      await expect(
        service.adjustUnitScore(unit.id, unit.tenantId, unit.score),
      ).rejects.toThrow(new NotFoundException(EUnitErrors.UNITS_NOT_FOUND));
    });
  });

  describe('deleteUnit', () => {
    const response: DeleteResult = {
      raw: [],
      affected: 1,
    };

    it(`should return { message: ${EUnitSuccess.DELETE}, data: null } when the unit is deleted success`, async () => {
      repositoryMock.deleteUnit.mockResolvedValue(response);

      expect(await service.deleteUnit(unit.id, unit.tenantId)).toEqual({
        message: EUnitSuccess.DELETE,
        data: null,
      });
    });

    it('should return NotFoundExpception when unit not found', async () => {
      response.affected = 0;
      repositoryMock.deleteUnit.mockResolvedValue(response);
      await expect(service.deleteUnit(unit.id, unit.tenantId)).rejects.toThrow(
        new NotFoundException(EUnitErrors.UNIT_NOT_FOUND),
      );
    });
  });
});
