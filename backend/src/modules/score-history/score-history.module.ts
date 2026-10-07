import { Module } from '@nestjs/common';
import { ScoreHistoryService } from './score-history.service';
import { ScoreHistoryController } from './score-history.controller';
import { ScoreHistoryRepository } from './score-history.repository';
import { UnitsModule } from '../units/units.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoreHistoryEntity } from './entity/score-history.entity';
import { UnitEntity } from '../units/entities/unit.entity';

@Module({
  imports: [
    UnitsModule,
    TypeOrmModule.forFeature([ScoreHistoryEntity, UnitEntity]),
  ],
  controllers: [ScoreHistoryController],
  providers: [
    { provide: 'IScoreHistoryService', useClass: ScoreHistoryService },
    { provide: 'IScoreHistoryRepository', useClass: ScoreHistoryRepository },
  ],
})
export class ScoreHistoryModule {}
