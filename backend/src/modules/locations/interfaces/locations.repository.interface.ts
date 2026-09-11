import { EntityManager, UpdateResult, DeleteResult } from 'typeorm';
import { LocationDto } from '../dtos/location.dto';
import { UpdateLocationDto } from '../dtos/update-location.dto';
import { Location } from '../entities/location.entity';

export interface ILocationsRepository {
  createLocation(
    locationDto: LocationDto & { tenantId: string },
    em?: EntityManager,
  ): Promise<Location>;

  findByCode(
    code: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<Location | null>;

  findById(
    id: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<Location | null>;

  findAllPaginated(
    tenantId: string,
    page: number,
    limit: number,
    em?: EntityManager,
  ): Promise<{ locations: Location[]; total: number }>;

  updateLocation(
    code: string,
    updateLocationDto: UpdateLocationDto,
    tenantId: string,
    em?: EntityManager,
  ): Promise<UpdateResult>;

  deleteLocation(
    code: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<DeleteResult>;
}
