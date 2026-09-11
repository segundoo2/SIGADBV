import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICategoriesRepository } from './interfaces/categories.repository.interface';
import { CategoryDto } from './dtos/category.dto';
import { Category } from './entities/category.entity';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { EErrorsGlobal } from '../../common/enum/errors-global.enum';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';

@Injectable()
export class CategoriesRepository implements ICategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  async createCategory(
    categoryDto: CategoryDto & { tenantId: string },
  ): Promise<Category> {
    try {
      const category: Category = this.repository.create(categoryDto);
      return await this.repository.save(category);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async updateCategory(
    id: string,
    tenantId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<UpdateResult> {
    try {
      return await this.repository.update({ id, tenantId }, updateCategoryDto);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findByCategoryName(
    nameCategory: string,
    tenantId: string,
  ): Promise<Category | null> {
    try {
      return await this.repository.findOne({
        where: { name: nameCategory, tenantId },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllCategories(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<[Category[], number]> {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 10;
      const skip = (page - 1) * limit;

      return await this.repository.findAndCount({
        where: { tenantId },
        skip,
        take: limit,
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async deleteCategory(id: string, tenantId: string): Promise<DeleteResult> {
    try {
      return await this.repository.delete({ id, tenantId });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
