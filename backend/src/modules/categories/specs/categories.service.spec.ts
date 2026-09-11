/* eslint-disable @typescript-eslint/unbound-method */
import { ECategorySuccess } from '../../../common/enum/category-success.enum';
import { IResponse } from '../../../common/interfaces/response.interface';
import { CategoriesService } from '../categories.service';
import { CategoryDto } from '../dtos/category.dto';
import { Category } from '../entities/category.entity';
import { ICategoriesRepository } from '../interfaces/categories.repository.interface';
import { ICategoriesService } from '../interfaces/categories.service.interface';
import { ECategoryErrors } from '../../../common/enum/category-errors.enum';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeleteResult, UpdateResult } from 'typeorm';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

describe('CategoriesService', () => {
  let service: ICategoriesService;
  let repository: jest.Mocked<ICategoriesRepository>;

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
    repository = {
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      findByCategoryName: jest.fn(),
      findAllCategories: jest.fn(),
      deleteCategory: jest.fn(),
    };

    service = new CategoriesService(repository);
  });

  describe('createCategory', () => {
    it(`should return the object { message: ${ECategorySuccess.CREATE}, data: null } when category is created success`, async () => {
      const expectedResponse: IResponse<null> = {
        message: ECategorySuccess.CREATE,
        data: null,
      };

      repository.createCategory.mockResolvedValue(category);
      expect(
        await service.createCategory({
          ...categoryDto,
          tenantId: category.tenantId,
        }),
      ).toEqual(expectedResponse);
      expect(repository.createCategory).toHaveBeenCalledWith({
        ...categoryDto,
        tenantId: category.tenantId,
      });
    });

    it('should return ConflictException when category is existed', async () => {
      repository.findByCategoryName.mockResolvedValue(category);
      await expect(
        service.createCategory({ ...categoryDto, tenantId: category.tenantId }),
      ).rejects.toThrow(
        new ConflictException(ECategoryErrors.CONFLICT_CATEGORY),
      );
    });
  });

  describe('updateCategory', () => {
    const expectedResponse: IResponse<null> = {
      message: ECategorySuccess.UPDATE,
      data: null,
    };
    const responseRepository: UpdateResult = {
      raw: [],
      generatedMaps: [],
      affected: 1,
    };

    it(`should return { message: ${ECategorySuccess.UPDATE}, data: null } when the category is update success`, async () => {
      repository.updateCategory.mockResolvedValue(responseRepository);
      expect(
        await service.updateCategory(
          category.id,
          category.tenantId,
          categoryDto,
        ),
      ).toEqual(expectedResponse);
      expect(repository.updateCategory).toHaveBeenCalledWith(
        category.id,
        category.tenantId,
        categoryDto,
      );
    });

    it('should return NotFoundException when property affected is equal 0', async () => {
      responseRepository.affected = 0;
      repository.updateCategory.mockResolvedValue(responseRepository);
      await expect(
        service.updateCategory(category.id, category.tenantId, categoryDto),
      ).rejects.toThrow(
        new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND),
      );
    });
  });

  describe('findByCategoryName', () => {
    it(`should return the object { message: ${ECategorySuccess.FOUND_CATEGORY}, data: Category }`, async () => {
      const expectedResponse: IResponse<Category> = {
        message: ECategorySuccess.FOUND_CATEGORY,
        data: category,
      };

      repository.findByCategoryName.mockResolvedValue(category);
      expect(
        await service.findByCategoryName(category.name, category.tenantId),
      ).toEqual(expectedResponse);
      expect(repository.findByCategoryName).toHaveBeenCalledWith(
        category.name,
        category.tenantId,
      );
    });

    it('should return NotFoundException when Category not found', async () => {
      repository.findByCategoryName.mockResolvedValue(null);
      await expect(
        service.findByCategoryName(category.name, category.tenantId),
      ).rejects.toThrow(
        new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND),
      );
    });
  });

  describe('findAllCategories', () => {
    const categoriesList: Category[] = [category, category, category];
    const pagination: PaginationQueryDto = { page: 1, limit: 10 };

    it('should return tuple response when categories are found', async () => {
      const expectedResponse: IResponse<[Category[], number]> = {
        message: ECategorySuccess.FOUND_CATEGORIES_LIST,
        data: [categoriesList, 3],
      };

      repository.findAllCategories.mockResolvedValue([categoriesList, 3]);

      expect(
        await service.findAllCategories(category.tenantId, pagination),
      ).toEqual(expectedResponse);

      expect(repository.findAllCategories).toHaveBeenCalledWith(
        category.tenantId,
        pagination,
      );
    });

    it('should return NotFoundException when total count is 0', async () => {
      repository.findAllCategories.mockResolvedValue([[], 0]);

      await expect(
        service.findAllCategories(category.tenantId, pagination),
      ).rejects.toThrow(
        new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND),
      );
    });
  });

  describe('deleteCategory', () => {
    const expectedResponse: IResponse<null> = {
      message: ECategorySuccess.DELETE,
      data: null,
    };
    const deleteResult: DeleteResult = {
      raw: [],
      affected: 1,
    };

    it(`should return the objects { message: ${ECategorySuccess.DELETE}, data: null }`, async () => {
      repository.deleteCategory.mockResolvedValue(deleteResult);
      expect(
        await service.deleteCategory(category.id, category.tenantId),
      ).toEqual(expectedResponse);
      expect(repository.deleteCategory).toHaveBeenCalledWith(
        category.id,
        category.tenantId,
      );
    });

    it('should return NotFoundException when the property affected === 0', async () => {
      deleteResult.affected = 0;
      repository.deleteCategory.mockResolvedValue(deleteResult);
      await expect(
        service.deleteCategory(category.id, category.tenantId),
      ).rejects.toThrow(
        new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND),
      );
    });
  });
});
