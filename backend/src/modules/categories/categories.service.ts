import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ICategoriesService } from './interfaces/categories.service.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { CategoryDto } from './dtos/category.dto';
import type { ICategoriesRepository } from './interfaces/categories.repository.interface';
import { ECategorySuccess } from '../../common/enum/category-success.enum';
import { Category } from './entities/category.entity';
import { ECategoryErrors } from '../../common/enum/category-errors.enum';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';

@Injectable()
export class CategoriesService implements ICategoriesService {
  constructor(
    @Inject('ICategoriesRespository')
    private readonly repository: ICategoriesRepository,
  ) {}

  async createCategory(
    categoryDto: CategoryDto & { tenantId: string },
  ): Promise<IResponse<null>> {
    const categoryExisted = await this.repository.findByCategoryName(
      categoryDto.tenantId,
      categoryDto.name,
    );

    if (categoryExisted) {
      throw new ConflictException(ECategoryErrors.CONFLICT_CATEGORY);
    }

    await this.repository.createCategory(categoryDto);
    return { message: ECategorySuccess.CREATE, data: null };
  }

  async updateCategory(
    id: string,
    tenantId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<IResponse<null>> {
    const response = await this.repository.updateCategory(
      id,
      tenantId,
      updateCategoryDto,
    );

    if (response.affected === 0) {
      throw new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND);
    }

    return {
      message: ECategorySuccess.UPDATE,
      data: null,
    };
  }

  async findByCategoryName(
    nameCategory: string,
    tenantId: string,
  ): Promise<IResponse<Category>> {
    const category = await this.repository.findByCategoryName(
      nameCategory,
      tenantId,
    );

    if (!category) {
      throw new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND);
    }

    return {
      message: ECategorySuccess.FOUND_CATEGORY,
      data: category,
    };
  }

  async findAllCategories(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<IResponse<[Category[], number]>> {
    const [categoriesList, total] = await this.repository.findAllCategories(
      tenantId,
      pagination,
    );

    if (total === 0 || categoriesList.length === 0) {
      throw new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND);
    }

    return {
      message: ECategorySuccess.FOUND_CATEGORIES_LIST,
      data: [categoriesList, total],
    };
  }

  async deleteCategory(id: string, tenantId: string): Promise<IResponse<null>> {
    const deletedCategory = await this.repository.deleteCategory(id, tenantId);

    if (deletedCategory.affected === 0) {
      throw new NotFoundException(ECategoryErrors.CATEGORY_NOT_FOUND);
    }

    return {
      message: ECategorySuccess.DELETE,
      data: null,
    };
  }
}
