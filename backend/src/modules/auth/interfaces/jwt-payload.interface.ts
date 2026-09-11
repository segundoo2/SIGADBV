import { EPermission } from '../../../common/enum/permissions.enum';

export interface IJwtPayload {
  sub: string;
  tenantId: string;
  username: string;
  roles: string[];
  permissions: EPermission[];
  fingerprint: string;
}

export interface IJwtPayloadWithExpiry extends IJwtPayload {
  exp: number;
  iat?: number;
}
