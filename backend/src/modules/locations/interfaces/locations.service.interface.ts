import { EntityManager } from 'typeorm';
import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { LocationDto } from '../dtos/location.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { Location } from '../entities/location.entity';

export interface ILocationsService {
  createLocation(
    locationDto: LocationDto & { tenantId: string },
  ): Promise<IResponse<null>>;

  findByCode(code: string, tenantId: string): Promise<IResponse<Location>>;

  findById(
    id: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<Location | null>;

  findAllLocations(
    tenantId: string,
    pagination: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Location[]>>;

  updateLocation(
    code: string,
    updateLocationDto: UpdateLocationDto,
    tenantId: string,
  ): Promise<IResponse<null>>;

  deleteLocation(code: string, tenantId: string): Promise<IResponse<null>>;

  allocateProduct(
    dto: {
      productId: string;
      targetLocationId: string;
      sourceLocationId?: string;
      quantity: number;
      tenantId: string;
      currentProductStock: number;
    },
    em?: EntityManager,
  ): Promise<void>;

  sumAllocatedStock(
    productId: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<number>;

  incrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    em?: EntityManager,
  ): Promise<void>;

  decrementQuantity(
    productId: string,
    locationId: string,
    tenantId: string,
    quantity: number,
    em?: EntityManager,
  ): Promise<void>;
}
