import { DeleteResult, UpdateResult } from 'typeorm';
import { CategoryDto } from '../dtos/category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { Category } from '../entities/category.entity';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';

export interface ICategoriesRepository {
  createCategory(
    categoryDto: CategoryDto & { tenantId: string },
  ): Promise<Category>;

  updateCategory(
    id: string,
    tenantId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<UpdateResult>;

  findByCategoryName(
    nameCategory: string,
    tenantId: string,
  ): Promise<Category | null>;

  findAllCategories(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Category[], number]>;

  deleteCategory(id: string, tenantId: string): Promise<DeleteResult>;
}
