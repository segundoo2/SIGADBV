import { PaginationQueryDto } from '../../../common/dtos/pagination-query.dto';
import { IPaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { IResponse } from '../../../common/interfaces/response.interface';
import { AllocateLocationDto } from '../dtos/allocate-product-location.dto';
import { MovementDto } from '../dtos/movement.dto';
import { Movement } from '../entities/movement.entity';

export interface IMovementsController {
  registerMovement(
    movements: MovementDto,
    tenantId: string,
  ): Promise<IResponse<null>>;
  allocateLocation(
    dto: AllocateLocationDto,
    tenantId: string,
  ): Promise<IResponse<null>>;
  findAllPaginatedByProduct(
    productId: string,
    tenantId: string,
    query: PaginationQueryDto,
  ): Promise<IPaginatedResponse<Movement[]>>;
}
