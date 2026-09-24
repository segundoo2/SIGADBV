import { Module } from '@nestjs/common';
import { ScoreHistoryService } from './score-history.service';
import { ScoreHistoryController } from './score-history.controller';
import { ScoreHistoryRepository } from './score-history.repository';
import { UnitsModule } from '../units/units.module';

@Module({
  imports: [UnitsModule],
  controllers: [ScoreHistoryController],
  providers: [
    { provide: 'IScoreHistoryService', useClass: ScoreHistoryService },
    { provide: 'IScoreHistoryRepository', useClass: ScoreHistoryRepository },
  ],
})
export class ScoreHistoryModule {}
