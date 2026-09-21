/* eslint-disable @typescript-eslint/unbound-method */
import { InternalServerErrorException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EErrorsGlobal } from '../../../common/enum/global/errors-global.enum';
import { EMovementType, MovementDto } from '../dtos/movement.dto';
import { Movement } from '../entities/movement.entity';
import { MovementsRepository } from '../movements.repository';

type MockRepository<T extends object = object> = {
  [P in keyof Repository<T>]?: jest.Mock;
};

describe('MovementsRepository', () => {
  let repository: MovementsRepository;
  let ormMock: MockRepository<Movement>;

  const tenantId = 'tenant-uuid-123';
  const productId = 'd3b07384-d113-424a-a1d2-06834d858348';

  const movementDto: MovementDto & { tenantId: string } = {
    tenantId,
    typeMovement: EMovementType.IN,
    productId,
    locationId: 'f21a48c9-598d-4a14-8789-08226edb3b0d',
    quantity: 10,
    reason: 'Entrada NF',
  };

  const mockEntity = {
    id: '123-uuid',
    ...movementDto,
    createdAt: new Date(),
  } as Movement;

  beforeEach(async () => {
    ormMock = {
      create: jest.fn(),
      save: jest.fn(),
      findAndCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovementsRepository,
        {
          provide: getRepositoryToken(Movement),
          useValue: ormMock,
        },
      ],
    }).compile();

    repository = module.get<MovementsRepository>(MovementsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerMovement', () => {
    it('should register movement successfully using default repository', async () => {
      ormMock.create?.mockReturnValue(mockEntity);
      ormMock.save?.mockResolvedValue(mockEntity);

      await expect(
        repository.registerMovement(movementDto),
      ).resolves.not.toThrow();

      expect(ormMock.create).toHaveBeenCalledWith(movementDto);
      expect(ormMock.save).toHaveBeenCalledWith(mockEntity);
    });

    it('should register movement successfully using transactional EntityManager when provided', async () => {
      const txRepository = {
        create: jest.fn().mockReturnValue(mockEntity),
        save: jest.fn().mockResolvedValue(mockEntity),
      };

      const mockEntityManager = {
        getRepository: jest.fn().mockReturnValue(txRepository),
      } as unknown as EntityManager;

      await expect(
        repository.registerMovement(movementDto, mockEntityManager),
      ).resolves.not.toThrow();

      expect(mockEntityManager.getRepository).toHaveBeenCalledWith(Movement);
      expect(txRepository.create).toHaveBeenCalledWith(movementDto);
      expect(txRepository.save).toHaveBeenCalledWith(mockEntity);
    });

    it('should allow registering movement without locationId (general stock input)', async () => {
      const movementWithoutLocation = {
        ...movementDto,
        locationId: undefined,
      };

      ormMock.create?.mockReturnValue(mockEntity);
      ormMock.save?.mockResolvedValue(mockEntity);

      await expect(
        repository.registerMovement(movementWithoutLocation),
      ).resolves.not.toThrow();

      expect(ormMock.create).toHaveBeenCalledWith(movementWithoutLocation);
    });

    it('should throw InternalServerErrorException when save fails', async () => {
      ormMock.create?.mockReturnValue(mockEntity);
      ormMock.save?.mockRejectedValue(new Error('DB Error'));

      await expect(repository.registerMovement(movementDto)).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  });

  describe('findAllPaginatedByProduct', () => {
    it('should return paginated movements list and total count', async () => {
      ormMock.findAndCount?.mockResolvedValue([[mockEntity], 1]);

      const result = await repository.findAllPaginatedByProduct(
        productId,
        tenantId,
        1,
        10,
      );

      expect(result).toEqual({ movements: [mockEntity], total: 1 });
      expect(ormMock.findAndCount).toHaveBeenCalledWith({
        where: { productId, tenantId },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: { location: true },
      });
    });

    it('should throw InternalServerErrorException when findAndCount fails', async () => {
      ormMock.findAndCount?.mockRejectedValue(new Error('DB Error'));

      await expect(
        repository.findAllPaginatedByProduct(productId, tenantId, 1, 10),
      ).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  });
});
