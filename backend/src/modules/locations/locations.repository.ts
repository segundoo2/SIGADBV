import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, EntityManager, Repository, UpdateResult } from 'typeorm';
import { ILocationsRepository } from './interfaces/locations.repository.interface';
import { Location } from './entities/location.entity';
import { LocationDto } from './dtos/location.dto';
import { UpdateLocationDto } from './dtos/update-location.dto';
import { EErrorsGlobal } from '../../common/enum/global/errors-global.enum';

@Injectable()
export class LocationsRepository implements ILocationsRepository {
  constructor(
    @InjectRepository(Location)
    private readonly repository: Repository<Location>,
  ) {}

  private getRepo(em?: EntityManager): Repository<Location> {
    return em ? em.getRepository(Location) : this.repository;
  }

  async createLocation(
    locationDto: LocationDto & { tenantId: string },
    em?: EntityManager,
  ): Promise<Location> {
    try {
      const repo = this.getRepo(em);
      const location = repo.create(locationDto);
      return await repo.save(location);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findByCode(
    code: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<Location | null> {
    try {
      return await this.getRepo(em).findOne({
        where: { code, tenantId },
        relations: { productLocations: true },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findById(
    id: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<Location | null> {
    try {
      return await this.getRepo(em).findOne({
        where: { id, tenantId },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllPaginated(
    tenantId: string,
    page: number,
    limit: number,
    em?: EntityManager,
  ): Promise<{ locations: Location[]; total: number }> {
    try {
      const [locations, total] = await this.getRepo(em).findAndCount({
        where: { tenantId },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });

      return { locations, total };
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async updateLocation(
    code: string,
    updateLocationDto: UpdateLocationDto,
    tenantId: string,
    em?: EntityManager,
  ): Promise<UpdateResult> {
    try {
      return await this.getRepo(em).update(
        { code, tenantId },
        updateLocationDto,
      );
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async deleteLocation(
    code: string,
    tenantId: string,
    em?: EntityManager,
  ): Promise<DeleteResult> {
    try {
      return await this.getRepo(em).delete({ code, tenantId });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
