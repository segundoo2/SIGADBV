import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IResponse } from '../../../common/interfaces/response.interface';
import { CategoryDto } from '../dtos/category.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { Category } from '../entities/category.entity';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';

export interface ICategoriesController {
  createCategory(
    tenantId: string,
    CategoryDto: CategoryDto,
  ): Promise<IResponse<null>>;

  updateCategory(
    id: string,
    tenantId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<IResponse<null>>;

  findByCategoryName(
    tenantId: string,
    nameCategory: string,
  ): Promise<IResponse<Category>>;

  findAllCategories(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Category[]>>;

  deleteCategory(id: string, tenantId: string): Promise<IResponse<null>>;
}
