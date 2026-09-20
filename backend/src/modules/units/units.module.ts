import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { UnitsRepository } from './units.repository';

@Module({
  controllers: [UnitsController],
  providers: [
    { provide: 'IUnitsService', useClass: UnitsService },
    { provide: 'IUnitsRepository', useClass: UnitsRepository },
  ],
})
export class UnitsModule {}
