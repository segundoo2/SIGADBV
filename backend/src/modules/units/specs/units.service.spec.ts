import { EUnitGender } from '../../../common/enum/unit/unit-gender.enum';
import { CreateUnitDto } from '../dto/create-unit.dto';
import { UnitEntity } from '../entities/unit.entity';
import { ObjectLiteral, Repository } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { UnitsRepository } from '../units.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';

type MockRepository<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('UnitService', () => {
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
    totalPoints: 10000,
    maxMembers: 6,
    members: ['ed'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('createUnit', () => {
    const createUnitDto: CreateUnitDto & { tenantId: string } = {
      tenantId: 'uuid-club',
      name: 'Gavião-Real',
      gender: EUnitGender.FEMALE,
      maxMembers: 6,
    };

    it('should return unit entity when the unit created with success', async () => {
      ormMock.create?.mockReturnValue(unit);
      ormMock.save?.mockResolvedValue(unit);
      expect(await repository.createUnit(createUnitDto)).toEqual(unit);
      expect(ormMock.create).toHaveBeenCalledWith(createUnitDto);
      expect(ormMock.save).toHaveBeenCalledWith(unit);
    });

    shouldHandleDatabaseErrors(
      () => repository.createUnit(createUnitDto),
      () => ormMock.save,
    );
  });

  describe('findOneByUnitName', () => {
    it('should return unit entity when unit is found', async () => {
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
});
