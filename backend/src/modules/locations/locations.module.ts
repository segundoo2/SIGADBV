import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsRepository } from './locations.repository';
import { ProductLocationsRepository } from './product-locations.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './entities/location.entity';
import { ProductLocation } from './entities/product-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Location, ProductLocation])],
  controllers: [LocationsController],
  providers: [
    { provide: 'ILocationsService', useClass: LocationsService },
    { provide: 'ILocationsRepository', useClass: LocationsRepository },
    {
      provide: 'IProductLocationsRepository',
      useClass: ProductLocationsRepository,
    },
  ],
  exports: ['ILocationsService', 'IProductLocationsRepository'],
})
export class LocationsModule {}
