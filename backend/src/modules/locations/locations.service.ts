import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { ELocationErrorsMessage } from '../../common/enum/location-errors.enum';
import { ELocationSuccessMessage } from '../../common/enum/location-success.enum';
import { PaginationQueryDto } from '../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../common/interfaces/response.interface';
import { LocationDto } from './dtos/location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { ELocationType, Location } from './entities/location.entity';
import type { ILocationsRepository } from './interfaces/locations.repository.interface';
import type { ILocationsService } from './interfaces/locations.service.interface';
import type { IProductLocationsRepository } from './interfaces/product-locations.repository.interface';
import { AllocateDto } from './dtos/allocate.dto';
import { ValidateAllocationDto } from './dtos/validate-allocation.dto';

@Injectable()
export class LocationsService implements ILocationsService {
  constructor(
    @Inject('ILocationsRepository')
    private readonly repository: ILocationsRepository,
    @Inject('IProductLocationsRepository')
    private readonly productLocationsRepository: IProductLocationsRepository,
  ) {}

  async createLocation(
    locationDto: LocationDto & { tenantId: string },
    em?: EntityManager,
  ): Promise<IResponse<null>> {
    const findLocation = await this.repository.findByCode(
      locationDto.code,
      locationDto.tenantId,
      em,
    );

    if (findLocation) {
      throw new ConflictException(ELocationErrorsMessage.CONFLICT);
    }

    if (locationDto.type === ELocationType.DISPLAY && !locationDto.capacity) {
      throw new BadRequestException(ELocationErrorsMessage.CAPACITY_NULL);
    }

    await this.repository.createLocation(locationDto, em);

    return {
      message: ELocationSuccessMessage.CREATE,
      data: null,
    };
  }

  async findByCode(
    code: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<IResponse<Location>> {
    const locationFound = await this.repository.findByCode(code, tenantId, em);

    if (!locationFound) {
      throw new NotFoundException(ELocationErrorsMessage.NOT_FOUND);
    }

    return {
      message: ELocationSuccessMessage.FINDONE,
      data: locationFound,
    };
  }

  async findById(
    id: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<Location | null> {
    return await this.repository.findById(id, tenantId, em);
  }

  async findAllLocations(
    tenantId: string,
    pagination: PaginationQueryDto,
    em?: EntityManager,
  ): Promise<IPaginatedResponse<Location[]>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;

    const { locations, total } = await this.repository.findAllPaginated(
      tenantId,
      page,
      limit,
      em,
    );

    if (locations.length === 0) {
      throw new NotFoundException(ELocationErrorsMessage.NOT_FOUND);
    }

    const totalPages = Math.ceil(total / limit);

    return {
      message: ELocationSuccessMessage.FIND_ALL,
      data: locations,
      meta: {
        itemCount: locations.length,
        totalItems: total,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async updateLocation(
    code: string,
    updateLocationDto: UpdateLocationDto,
    tenantId: string,
    em?: EntityManager,
  ): Promise<IResponse<null>> {
    const currentLocation = await this.repository.findByCode(
      code,
      tenantId,
      em,
    );

    if (!currentLocation) {
      throw new NotFoundException(ELocationErrorsMessage.NOT_FOUND);
    }

    const targetType = updateLocationDto.type ?? currentLocation.type;
    const targetCapacity =
      updateLocationDto.capacity !== undefined
        ? updateLocationDto.capacity
        : currentLocation.capacity;

    if (targetType === ELocationType.DISPLAY && !targetCapacity) {
      throw new BadRequestException(ELocationErrorsMessage.CAPACITY_NULL);
    }

    const updatedLocation = await this.repository.updateLocation(
      code,
      updateLocationDto,
      tenantId,
      em,
    );

    if (updatedLocation.affected === 0) {
      throw new NotFoundException(ELocationErrorsMessage.NOT_FOUND);
    }

    return { message: ELocationSuccessMessage.UPDATE, data: null };
  }

  async deleteLocation(
    code: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<IResponse<null>> {
    const productListLocation = await this.repository.findByCode(
      code,
      tenantId,
      em,
    );

    if (
      productListLocation?.productLocations &&
      productListLocation.productLocations.length > 0
    ) {
      throw new ConflictException(ELocationErrorsMessage.CONFLICT_DELETE);
    }

    const deletedLocation = await this.repository.deleteLocation(
      code,
      tenantId,
      em,
    );

    if (deletedLocation.affected === 0) {
      throw new NotFoundException(ELocationErrorsMessage.NOT_FOUND);
    }

    return {
      message: ELocationSuccessMessage.DELETE,
      data: null,
    };
  }

  async allocateProduct(
    dto: {
      productId: string;
      targetLocationId: string;
      sourceLocationId?: string;
      quantity: number;
      tenantId: string;
      currentProductStock: number;
    },
    em?: EntityManager,
  ): Promise<void> {
    await this.validateAllocation(dto, em);
    await this.allocate(dto, em);
  }

  async sumAllocatedStock(
    productId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<number> {
    return await this.productLocationsRepository.sumAllocatedStock(
      productId,
      tenantId,
      em,
    );
  }

  async incrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    em?: EntityManager,
  ): Promise<void> {
    return await this.productLocationsRepository.incrementQuantity(
      productId,
      locationId,
      tenantId,
      quantity,
      em,
    );
  }

  async decrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    em?: EntityManager,
  ): Promise<void> {
    return await this.productLocationsRepository.decrementQuantity(
      productId,
      locationId,
      tenantId,
      quantity,
      em,
    );
  }

  // --- Helpers Privados ---

  private async validateAllocation(
    dto: ValidateAllocationDto,
    em?: EntityManager,
  ): Promise<void> {
    if (dto.sourceLocationId && dto.sourceLocationId === dto.targetLocationId) {
      throw new BadRequestException(ELocationErrorsMessage.CONFLICT_TRANSFER);
    }

    const targetLocation = await this.repository.findById(
      dto.targetLocationId,
      dto.tenantId,
      em,
    );

    if (!targetLocation) {
      throw new NotFoundException(ELocationErrorsMessage.NOT_FOUND);
    }

    // --- Regras de Negócio Específicas para DISPLAY ---
    if (targetLocation.type === ELocationType.DISPLAY) {
      if (dto.sourceLocationId) {
        const sourceLocation = await this.repository.findById(
          dto.sourceLocationId,
          dto.tenantId,
          em,
        );

        if (!sourceLocation) {
          throw new NotFoundException(ELocationErrorsMessage.NOT_FOUND);
        }

        if (sourceLocation.type !== ELocationType.STORAGE) {
          throw new BadRequestException(ELocationErrorsMessage.POSITION_ORIGIN);
        }
      }

      const currentProductInLocation =
        await this.productLocationsRepository.findByProductAndLocation(
          dto.productId,
          dto.targetLocationId,
          dto.tenantId,
          em,
        );

      const totalDifferentProducts =
        await this.productLocationsRepository.countActiveProductsInLocation(
          dto.targetLocationId,
          dto.tenantId,
          em,
        );

      const isNewProductInLocation =
        !currentProductInLocation || currentProductInLocation.quantity === 0;

      if (isNewProductInLocation && totalDifferentProducts > 0) {
        throw new ConflictException(ELocationErrorsMessage.POSITION_ALLOCATION);
      }

      if (targetLocation.capacity) {
        const currentQuantityInTarget = currentProductInLocation?.quantity ?? 0;
        const projectedQuantity = currentQuantityInTarget + dto.quantity;

        if (projectedQuantity > targetLocation.capacity) {
          throw new BadRequestException(
            `${ELocationErrorsMessage.CAPACITY_POSITION} ${targetLocation.capacity}`,
          );
        }
      }
    }

    if (dto.sourceLocationId) {
      const sourceProductLocation =
        await this.productLocationsRepository.findByProductAndLocation(
          dto.productId,
          dto.sourceLocationId,
          dto.tenantId,
          em,
        );

      const currentSourceStock = sourceProductLocation?.quantity ?? 0;

      if (dto.quantity > currentSourceStock) {
        throw new BadRequestException(
          `${ELocationErrorsMessage.INSUFFICIENT_QUANTITY} ${currentSourceStock}, Solicitado: ${dto.quantity}`,
        );
      }
    } else {
      const totalAllocated =
        await this.productLocationsRepository.sumAllocatedStock(
          dto.productId,
          dto.tenantId,
          em,
        );

      const unallocatedStock = dto.currentProductStock - totalAllocated;

      if (dto.quantity > unallocatedStock) {
        throw new BadRequestException(
          `${ELocationErrorsMessage.OVER_ALLOCATION} Saldo não alocado disponível: ${unallocatedStock}`,
        );
      }
    }
  }

  private async allocate(dto: AllocateDto, em?: EntityManager): Promise<void> {
    if (dto.sourceLocationId) {
      await this.productLocationsRepository.decrementQuantity(
        dto.productId,
        dto.sourceLocationId,
        dto.tenantId,
        dto.quantity,
        em,
      );
    }

    await this.productLocationsRepository.incrementQuantity(
      dto.productId,
      dto.targetLocationId,
      dto.tenantId,
      dto.quantity,
      em,
    );
  }
}
