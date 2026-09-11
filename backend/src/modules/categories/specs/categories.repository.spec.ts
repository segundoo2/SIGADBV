/* eslint-disable @typescript-eslint/unbound-method */
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { Category } from '../entities/category.entity';
import { ICategoriesRepository } from '../interfaces/categories.repository.interface';
import { CategoriesRepository } from '../categories.repository';
import { CategoryDto } from '../dtos/category.dto';
import { InternalServerErrorException } from '@nestjs/common';
import { EErrorsGlobal } from '../../../common/enum/errors-global.enum';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

describe('CategoriesRepository', () => {
  let categoriesRepository: ICategoriesRepository;
  let ormRepository: jest.Mocked<Repository<Category>>;

  const categoryDto: CategoryDto = {
    name: 'capinhas',
    isActive: true,
    description: 'capinhas de celulares de diversos modelos',
  };
  const category: Category = {
    id: 'uuid',
    tenantId: 'tenant-uuid',
    name: 'capinhas',
    description: 'capinhas variadas',
    isActive: true,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    ormRepository = {
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<Category>>;

    categoriesRepository = new CategoriesRepository(ormRepository);
  });

  const shouldHandleDatabaseErrors = (
    operation: () => Promise<unknown>,
    mockMethod: () => jest.Mock | undefined,
  ) => {
    it('should return InternalServerException when TypeORM throws an error', async () => {
      mockMethod()?.mockRejectedValue(
        new Error('[TypeOrmModule] Unable to connect to the database'),
      );

      await expect(operation()).rejects.toThrow(
        new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR),
      );
    });
  };

  describe('createCategory', () => {
    it('should return the category entity when it is save success', async () => {
      ormRepository.create.mockReturnValue(category);
      ormRepository.save.mockResolvedValue(category);
      expect(
        await categoriesRepository.createCategory({
          ...categoryDto,
          tenantId: category.tenantId,
        }),
      ).toEqual(category);
      expect(ormRepository.create).toHaveBeenCalledWith({
        ...categoryDto,
        tenantId: category.tenantId,
      });
      expect(ormRepository.save).toHaveBeenCalledWith(category);
    });

    shouldHandleDatabaseErrors(
      () =>
        categoriesRepository.createCategory({
          ...categoryDto,
          tenantId: category.tenantId,
        }),
      () => ormRepository.save as unknown as jest.Mock,
    );
  });

  describe('updateCategory', () => {
    const responseRepository: UpdateResult = {
      raw: [],
      generatedMaps: [],
      affected: 1,
    };

    it('should return the object { raw: [], generatedMaps: [], affected: 1 } when the category is updated success', async () => {
      ormRepository.update.mockResolvedValue(responseRepository);
      expect(
        await categoriesRepository.updateCategory(
          category.id,
          category.tenantId,
          categoryDto,
        ),
      ).toEqual(responseRepository);
      expect(ormRepository.update).toHaveBeenCalledWith(
        { id: category.id, tenantId: category.tenantId },
        categoryDto,
      );
    });

    shouldHandleDatabaseErrors(
      () =>
        categoriesRepository.updateCategory(
          category.id,
          category.tenantId,
          categoryDto,
        ),
      () => ormRepository.update as unknown as jest.Mock,
    );
  });

  describe('findByCategoryName', () => {
    it('should return Category when it is found success', async () => {
      ormRepository.findOne.mockResolvedValue(category);
      expect(
        await categoriesRepository.findByCategoryName(
          category.name,
          category.tenantId,
        ),
      ).toEqual(category);
      expect(ormRepository.findOne).toHaveBeenCalledWith({
        where: { name: category.name, tenantId: category.tenantId },
      });
    });

    shouldHandleDatabaseErrors(
      () =>
        categoriesRepository.findByCategoryName(
          category.name,
          category.tenantId,
        ),
      () => ormRepository.findOne as unknown as jest.Mock,
    );
  });

  describe('findAllCategories', () => {
    const categoriesList: Category[] = [category, category, category];
    const pagination: PaginationQueryDto = { page: 1, limit: 10 };

    it('should return category tuple [categories, total] when categories are found', async () => {
      ormRepository.findAndCount = jest
        .fn()
        .mockResolvedValue([categoriesList, 3]);

      expect(
        await categoriesRepository.findAllCategories(
          category.tenantId,
          pagination,
        ),
      ).toEqual([categoriesList, 3]);

      expect(ormRepository.findAndCount).toHaveBeenCalledWith({
        where: { tenantId: category.tenantId },
        skip: 0,
        take: 10,
      });
    });

    shouldHandleDatabaseErrors(
      () =>
        categoriesRepository.findAllCategories(category.tenantId, pagination),
      () => ormRepository.findAndCount as unknown as jest.Mock,
    );
  });

  describe('deleteCategory', () => {
    const deleteResult: DeleteResult = {
      raw: [],
      affected: 1,
    };

    it('should return { raw: [], affected: 1 } when the category is deleted success', async () => {
      ormRepository.delete.mockResolvedValue(deleteResult);
      expect(
        await categoriesRepository.deleteCategory(
          category.id,
          category.tenantId,
        ),
      ).toEqual(deleteResult);
    });

    shouldHandleDatabaseErrors(
      () => categoriesRepository.deleteCategory(category.id, category.tenantId),
      () => ormRepository.delete as unknown as jest.Mock,
    );
  });
});
