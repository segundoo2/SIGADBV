import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { EPermission } from '../enum/permissions.enum';
import { User } from '../../modules/users/entities/user.entity';

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
      .getRequest<Request & { user?: User }>();
    const user = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException(
        'Acesso negado: Usuário sem papéis atribuídos.',
      );
    }

    const userPermissions = new Set<string>(
      user.roles.flatMap((role) => role.permissions || []),
    );

    const hasPermission = userPermissions.has(requiredPermission);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acesso negado: Requer a permissão '${requiredPermission}'.`,
      );
    }

    return true;
  }
}
