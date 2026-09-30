import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitEntity } from '../units/entities/unit.entity';
import { MetricsRepository } from './metrics.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UnitEntity])],
  controllers: [MetricsController],
  providers: [
    { provide: 'IMetricsService', useClass: MetricsService },
    { provide: 'IMetricsRepository', useClass: MetricsRepository },
  ],
})
export class MetricsModule {}
