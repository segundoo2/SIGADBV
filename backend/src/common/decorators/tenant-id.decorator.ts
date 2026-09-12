import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user?: { tenantId: string } }>();
    return request.user?.tenantId ?? '00000000-0000-0000-0000-000000000000';
  },
);
