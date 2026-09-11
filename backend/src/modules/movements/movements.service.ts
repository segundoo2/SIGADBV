import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { EMovementsSuccess } from '../../common/enum/movements-success.enum';
import { EProductsErrors } from '../../common/enum/products-errors.enum';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import type { ILocationsService } from '../locations/interfaces/locations.service.interface';
import type { IProductsService } from '../products/interfaces/products.service.interface';
import { AllocateLocationDto } from './dtos/allocate-product-location.dto';
import { EMovementType, MovementDto } from './dtos/movement.dto';
import { Movement } from './entities/movement.entity';
import type { IMovementsRepository } from './interfaces/movements.repository.interface';
import { IMovementsService } from './interfaces/movements.service.interface';

@Injectable()
export class MovementsService implements IMovementsService {
  constructor(
    @Inject('IMovementsRepository')
    private readonly movementsRepository: IMovementsRepository,
    @Inject('IProductsService')
    private readonly productsService: IProductsService,
    @Inject('ILocationsService')
    private readonly locationsService: ILocationsService,
    private readonly dataSource: DataSource,
  ) {}

  async registerMovement(
    dto: MovementDto & { tenantId: string },
  ): Promise<IResponse<null>> {
    const product = await this.productsService.findOneById(
      dto.productId,
      dto.tenantId,
    );

    if (!product) {
      throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
    }

    const delta =
      dto.typeMovement === EMovementType.IN ? dto.quantity : -dto.quantity;

    await this.dataSource.transaction(async (manager) => {
      // 1. Atualiza o estoque geral no catálogo de produtos
      await this.productsService.applyStockDelta(
        dto.productId,
        dto.tenantId,
        delta,
        manager,
      );

      // 2. Registra o histórico da movimentação (com locationId opcional)
      await this.movementsRepository.registerMovement(dto, manager);
    });

    return {
      message: EMovementsSuccess.CREATE,
      data: null,
    };
  }

  async allocateLocation(
    dto: AllocateLocationDto & { tenantId: string },
  ): Promise<IResponse<null>> {
    await this.dataSource.transaction(async (manager) => {
      const product = await this.productsService.findOneById(
        dto.productId,
        dto.tenantId,
        manager,
      );

      if (!product) {
        throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
      }

      // 1. Executa a alocação/transferência nas tabelas de saldo por localização
      await this.locationsService.allocateProduct(
        {
          productId: dto.productId,
          targetLocationId: dto.targetLocationId,
          sourceLocationId: dto.sourceLocationId,
          quantity: dto.quantity,
          tenantId: dto.tenantId,
          currentProductStock: Number(product.currentStock),
        },
        manager,
      );

      // 2. Registra o histórico de movimentação
      if (dto.sourceLocationId) {
        // Se for transferência, registra a saída da origem e a entrada no destino
        await this.movementsRepository.registerMovement(
          {
            tenantId: dto.tenantId,
            productId: dto.productId,
            locationId: dto.sourceLocationId,
            quantity: dto.quantity,
            typeMovement: EMovementType.OUT,
            reason:
              dto.reason ??
              `Transferência para posição ${dto.targetLocationId}`,
          },
          manager,
        );

        await this.movementsRepository.registerMovement(
          {
            tenantId: dto.tenantId,
            productId: dto.productId,
            locationId: dto.targetLocationId,
            quantity: dto.quantity,
            typeMovement: EMovementType.IN,
            reason:
              dto.reason ??
              `Transferência recebida da posição ${dto.sourceLocationId}`,
          },
          manager,
        );
      } else {
        // Se for alocação do saldo geral, registra apenas a entrada na posição física
        await this.movementsRepository.registerMovement(
          {
            tenantId: dto.tenantId,
            productId: dto.productId,
            locationId: dto.targetLocationId,
            quantity: dto.quantity,
            typeMovement: EMovementType.TRANSFER,
            reason:
              dto.reason ??
              `Alocação do estoque geral para a posição ${dto.targetLocationId}`,
          },
          manager,
        );
      }
    });

    return {
      message: EMovementsSuccess.ALLOCATE_PRODUCT,
      data: null,
    };
  }

  async findAllPaginatedByProduct(
    productId: string,
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Movement[]>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const productExists = await this.productsService.findOneById(
      productId,
      tenantId,
    );

    if (!productExists) {
      throw new NotFoundException(EProductsErrors.PRODUCT_NOT_FOUND);
    }

    const { movements, total } =
      await this.movementsRepository.findAllPaginatedByProduct(
        productId,
        tenantId,
        page,
        limit,
      );

    const totalPages = Math.ceil(total / limit);

    return {
      message: EMovementsSuccess.FIND_ALL,
      data: movements,
      meta: {
        itemCount: movements.length,
        totalItems: total,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
