import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { UnitsRepository } from './units.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitEntity } from './entities/unit.entity';
import { ScoreHistoryEntity } from '../score-history/entity/score-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnitEntity, ScoreHistoryEntity])],
  controllers: [UnitsController],
  providers: [
    { provide: 'IUnitsService', useClass: UnitsService },
    { provide: 'IUnitsRepository', useClass: UnitsRepository },
  ],
  exports: ['IUnitsService'],
})
export class UnitsModule {}
