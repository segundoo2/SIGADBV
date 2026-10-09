import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { EPermission } from '../enum/role/permissions.enum';
import { IJwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<EPermission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: IJwtPayload }>();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException(
        'Acesso negado: Usuário sem permissões atribuídas.',
      );
    }

    const userPermissions = new Set<string>(user.permissions);
    const hasPermission = userPermissions.has(requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acesso negado: Requer a permissão '${requiredPermission}'.`,
      );
    }

    return true;
  }
}
