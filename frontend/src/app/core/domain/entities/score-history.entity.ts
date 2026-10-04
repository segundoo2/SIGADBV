import { IUnitEntity } from './unit.entity';

export interface IScoreHistoryEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly unitId: string;
  readonly unit?: IUnitEntity;
  readonly score: number;
  readonly description: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
