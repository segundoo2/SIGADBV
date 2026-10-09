import { IUnitEntity } from './unit.entity';

export interface IScoreHistoryEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly unitId: string;
  readonly unit?: IUnitEntity;
  readonly score: number;
  readonly description: string;
  readonly requestedById?: string;
  readonly requestedBy?: {
    readonly id: string;
    readonly username: string;
  };
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
