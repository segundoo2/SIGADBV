import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UnitEntity } from './entities/unit.entity';
import { IUnitsRepository } from './interfaces/units.repository.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { EErrorsGlobal } from '../../common/enum/global/errors-global.enum';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsRepository implements IUnitsRepository {
  constructor(
    @InjectRepository(UnitEntity)
    private readonly repository: Repository<UnitEntity>,
  ) {}

  async createUnit(
    dto: CreateUnitDto & { tenantId: string },
  ): Promise<UnitEntity> {
    try {
      const unit = this.repository.create(dto);
      return await this.repository.save(unit);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findOneByUnitName(
    unitName: string,
    tenantId: string,
  ): Promise<UnitEntity | null> {
    try {
      return await this.repository.findOne({
        where: { name: unitName, tenantId },
      });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findOneScoreById(id: string, tenantId: string): Promise<number | null> {
    try {
      const response = await this.repository.findOne({
        select: {
          score: true,
        },
        where: {
          id,
          tenantId,
        },
      });
      return response ? response.score : null;
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async findAllUnits(tenantId: string): Promise<UnitEntity[] | []> {
    try {
      return await this.repository.find({ where: { tenantId } });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async updateUnit(
    id: string,
    dto: UpdateUnitDto & { tenantId: string },
  ): Promise<UpdateResult> {
    try {
      return await this.repository.update({ id, tenantId: dto.tenantId }, dto);
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async adjustUnitScore(
    id: string,
    tenantId: string,
    scoreDelta: number,
  ): Promise<void> {
    try {
      await this.repository
        .createQueryBuilder()
        .update()
        .set({ score: () => 'score + :scoreDelta' })
        .setParameter('scoreDelta', scoreDelta)
        .where('id = :id AND tenantId = :tenantId', { id, tenantId })
        .execute();
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }

  async deleteUnit(id: string, tenantId: string): Promise<DeleteResult> {
    try {
      return await this.repository.delete({ id, tenantId });
    } catch {
      throw new InternalServerErrorException(EErrorsGlobal.SERVER_ERROR);
    }
  }
}
