import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsRepository } from './locations.repository';
import { ProductLocationsRepository } from './product-location.repository';

@Module({
  controllers: [LocationsController],
  providers: [
    { provide: 'ILocationsService', useClass: LocationsService },
    { provide: 'ILocationsRepository', useClass: LocationsRepository },
    {
      provide: 'IProductLocationsRepository',
      useClass: ProductLocationsRepository,
    },
  ],
  exports: ['IProductLocationRepository'],
})
export class LocationsModule {}
