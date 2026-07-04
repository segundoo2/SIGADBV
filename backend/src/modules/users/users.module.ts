import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    { provide: 'IUsersService', useClass: UsersService },
    { provide: 'IUsersRepository', useClass: UsersRepository },
  ],
})
export class UsersModule {}
