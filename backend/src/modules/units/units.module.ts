import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { UnitsRepository } from './units.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitEntity } from './entities/unit.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnitEntity])],
  controllers: [UnitsController],
  providers: [
    { provide: 'IUnitsService', useClass: UnitsService },
    { provide: 'IUnitsRepository', useClass: UnitsRepository },
  ],
})
export class UnitsModule {}
