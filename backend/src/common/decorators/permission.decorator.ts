import { SetMetadata } from '@nestjs/common';
import { EPermission } from '../enum/permissions.enum';

export const PERMISSION_KEY = 'permission';

export const RequiresPermission = (permission: EPermission) =>
  SetMetadata(PERMISSION_KEY, permission);
