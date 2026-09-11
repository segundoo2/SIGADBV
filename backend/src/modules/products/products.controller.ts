import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IProductsController } from './interfaces/products.controller.interface';
import { ProductDto } from './dtos/product.dto';
import type { IProductsService } from './interfaces/products.service.interface';
import { Product } from './entities/product.entity';
import { IResponse } from '../../common/interfaces/response.interface';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateProductDto } from './dtos/update-product.dto';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { EPermission } from '../../common/enum/permissions.enum';
import { RequiresPermission } from '../../common/decorators/permission.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@ApiTags('Products')
@ApiBearerAuth()
@ApiHeader({
  name: 'x-tenant-id',
  description: 'Identificador do Tenant',
  required: true,
})
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('products')
export class ProductsController implements IProductsController {
  constructor(
    @Inject('IProductsService')
    private readonly productsService: IProductsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequiresPermission(EPermission.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Cadastra um novo produto (Cadastro Rápido)' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Produto criado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de requisição inválidos.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Produto com este SKU já existe no tenant.',
  })
  async createProduct(
    @Body() productDto: ProductDto,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.productsService.createProduct({
      ...productDto,
      tenantId,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.PRODUCTS_UPDATE)
  @ApiOperation({
    summary: 'Atualiza um produto ou vincula dados adicionais (Ex: Categoria)',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto a ser atualizado',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto atualizado com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado.',
  })
  async updateProduct(
    @Body() updateProductDto: UpdateProductDto,
    @Param('id', ParseUUIDPipe) id: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.productsService.updateProduct(
      updateProductDto,
      id,
      tenantId,
    );
  }

  @Get(':sku')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.PRODUCTS_READ)
  @ApiOperation({ summary: 'Busca um produto pelo SKU' })
  @ApiParam({
    name: 'sku',
    description: 'Código SKU do produto',
    type: String,
    example: 'PROD-ALFA-001',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto localizado.',
    type: Product,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado.',
  })
  async findOneBySku(
    @Param('sku') sku: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<Product>> {
    return await this.productsService.findOneBySku(sku, tenantId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.PRODUCTS_READ)
  @ApiOperation({ summary: 'Lista os produtos do tenant com paginação' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de produtos retornada com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Nenhum produto encontrado para este tenant.',
  })
  async findAllProducts(
    @TenantId() tenantId: string,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Product[]>> {
    return await this.productsService.findAllProducts(
      tenantId,
      paginationQuery,
    );
  }

  @Delete(':sku')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission(EPermission.PRODUCTS_DELETE)
  @ApiOperation({ summary: 'Remove um produto pelo SKU' })
  @ApiParam({
    name: 'sku',
    description: 'Código SKU do produto a ser removido',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto removido com sucesso.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado.',
  })
  async deleteProduct(
    @Param('sku') sku: string,
    @TenantId() tenantId: string,
  ): Promise<IResponse<null>> {
    return await this.productsService.deleteProduct(sku, tenantId);
  }
}
