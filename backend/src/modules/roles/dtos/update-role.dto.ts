import { PartialType } from '@nestjs/swagger';
import { RoleDto } from './role.dto';

export class UpdateRoleDto extends PartialType(RoleDto) {}
