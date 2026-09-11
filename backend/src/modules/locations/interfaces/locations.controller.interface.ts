import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { LocationDto } from '../dtos/location.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { Location } from '../entities/location.entity';

export interface ILocationsController {
  createLocation(
    tenantId: string,
    locationDto: LocationDto,
  ): Promise<IResponse<null>>;

  findByCode(code: string, tenantId: string): Promise<IResponse<Location>>;

  findAllLocations(
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Location[]>>;

  updateLocation(
    code: string,
    updateLocationDto: UpdateLocationDto,
    tenantId: string,
  ): Promise<IResponse<null>>;

  deleteLocation(code: string, tenantId: string): Promise<IResponse<null>>;
}
