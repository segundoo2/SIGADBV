import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovementsController } from './movements.controller';
import { MovementsRepository } from './movements.repository';
import { MovementsService } from './movements.service';
import { Movement } from './entities/movement.entity';
import { ProductsModule } from '../products/products.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Movement]),
    ProductsModule,
    LocationsModule,
  ],
  controllers: [MovementsController],
  providers: [
    { provide: 'IMovementsService', useClass: MovementsService },
    { provide: 'IMovementsRepository', useClass: MovementsRepository },
  ],
  exports: ['IMovementsService'],
})
export class MovementsModule {}
