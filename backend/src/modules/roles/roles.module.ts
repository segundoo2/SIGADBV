import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { RolesRepository } from './roles.repository';
import { PermissionsController } from './permissions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  controllers: [RolesController, PermissionsController],
  providers: [
    { provide: 'IRolesRepository', useClass: RolesRepository },
    { provide: 'IRolesService', useClass: RolesService },
  ],
  exports: ['IRolesRepository', 'IRolesService'],
})
export class RolesModule {}
