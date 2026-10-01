import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';
import { DeleteResult, ObjectLiteral, Repository, UpdateResult } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { UnitsRepository } from '../units.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UnitRepository', () => {
  let repository: UnitsRepository;

  let ormMock: MockRepository<UnitEntity>;

  beforeEach(async () => {
    const mockFactory = (): MockRepository<Role> => ({
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UnitsRepository,

        {
          provide: getRepositoryToken(UnitEntity),

          useFactory: mockFactory,
        },
      ],
    }).compile();

    repository = module.get<UnitsRepository>(UnitsRepository);

    ormMock = module.get<MockRepository<UnitEntity>>(
      getRepositoryToken(UnitEntity),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const shouldHandleDatabaseErrors = (
    operation: () => Promise<unknown>,
    mockMethod: () => jest.Mock | undefined,
  ) => {
    it('should throw InternalServerErrorException when TypeORM operation fails', async () => {
      mockMethod()?.mockRejectedValue(new Error('Database error'));

      await expect(operation()).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  };

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

  const unitDto: CreateUnitDto & { tenantId: string } = {
    tenantId: 'uuid-club',
    name: 'Gavião-Real',
    gender: EUnitGender.FEMALE,
    maxMembers: 6,
  };

  describe('createUnit', () => {
    it('should return unit entity when she is created with success', async () => {
      ormMock.create?.mockReturnValue(unit);

      ormMock.save?.mockResolvedValue(unit);

      expect(await repository.createUnit(unitDto)).toEqual(unit);

      expect(ormMock.create).toHaveBeenCalledWith(unitDto);

      expect(ormMock.save).toHaveBeenCalledWith(unit);
    });

    shouldHandleDatabaseErrors(
      () => repository.createUnit(unitDto),
      () => ormMock.save,
    );
  });

  describe('findOneByUnitName', () => {
    it('should return unit entity when she is found', async () => {
      ormMock.findOne?.mockResolvedValue(unit);

      expect(
        await repository.findOneByUnitName(unit.name, unit.tenantId),
      ).toEqual(unit);
    });

    shouldHandleDatabaseErrors(
      () => repository.findOneByUnitName(unit.name, unit.tenantId),

      () => ormMock.findOne,
    );
  });

  describe('findOneScoreById', () => {
    it('should return unit entity when she is found', async () => {
      ormMock.findOne.mockResolvedValue({ score: unit.score });
      expect(await repository.findOneScoreById(unit.id, unit.tenantId)).toEqual(
        unit.score,
      );
    });

    shouldHandleDatabaseErrors(
      () => repository.findOneScoreById(unit.id, unit.tenantId),
      () => ormMock.findOne,
    );
  });

  describe('findAllUnits', () => {
    it('should return units list when she is found', async () => {
      ormMock.find?.mockResolvedValue([unit]);
      expect(await repository.findAllUnits(unit.tenantId)).toEqual([unit]);
    });

    shouldHandleDatabaseErrors(
      () => repository.findAllUnits(unit.tenantId),
      () => ormMock.find,
    );
  });

  describe('updateUnit', () => {
    const response: UpdateResult = {
      raw: [],
      generatedMaps: [],
      affected: 1,
    };

    it(`should return affected === 1 when the updated is success`, async () => {
      ormMock.update?.mockResolvedValue(response);
      expect(await repository.updateUnit(unit.id, unitDto)).toEqual(response);
    });

    shouldHandleDatabaseErrors(
      () => repository.updateUnit(unit.id, unitDto),
      () => ormMock.update,
    );
  });

  describe('adjustUnitScore', () => {
    let queryBuilderMock: {
      update: jest.Mock;
      set: jest.Mock;
      setParameter: jest.Mock;
      where: jest.Mock;
      execute: jest.Mock;
    };

    beforeEach(() => {
      queryBuilderMock = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      };

      ormMock.createQueryBuilder = jest.fn().mockReturnValue(queryBuilderMock);
    });

    it('should increment or decrement score value with success', async () => {
      const scoreDelta = 500;
      await repository.adjustUnitScore(unit.id, unit.tenantId, scoreDelta);

      expect(ormMock.createQueryBuilder).toHaveBeenCalledTimes(1);

      expect(queryBuilderMock.update).toHaveBeenCalledTimes(1);
      expect(queryBuilderMock.set).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        score: expect.any(Function),
      });
      expect(queryBuilderMock.setParameter).toHaveBeenCalledWith(
        'scoreDelta',
        scoreDelta,
      );
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'id = :id AND tenantId = :tenantId',
        { id: unit.id, tenantId: unit.tenantId },
      );
      expect(queryBuilderMock.execute).toHaveBeenCalledTimes(1);
    });

    shouldHandleDatabaseErrors(
      () => repository.adjustUnitScore(unit.id, unit.tenantId, unit.score),
      () => queryBuilderMock.execute, // Alterado de ormMock.find para queryBuilderMock.execute
    );
  });

  describe('deleteUnit', () => {
    it('should return affected === 1 when the unit is deleted success', async () => {
      const response: DeleteResult = {
        raw: [],
        affected: 1,
      };
      ormMock.delete?.mockResolvedValue(response);
      expect(await repository.deleteUnit(unit.id, unit.tenantId)).toEqual(
        response,
      );
    });

    shouldHandleDatabaseErrors(
      () => repository.deleteUnit(unit.id, unit.tenantId),

      () => ormMock.delete,
    );
  });
});
