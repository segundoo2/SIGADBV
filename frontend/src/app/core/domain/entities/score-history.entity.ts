import { IUnitEntity } from './unit.entity';
import { EScoreHistoryStatus } from '../enums/score-history-status.enum';

export interface IScoreHistoryEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly unitId: string;
  readonly unit?: IUnitEntity;
  readonly score: number;
  readonly description: string;
  readonly status: EScoreHistoryStatus;
  readonly requestedById?: string;
  readonly requestedBy?: {
    readonly id: string;
    readonly username: string;
  };
  readonly approvedById?: string | null;
  readonly approvedBy?: {
    readonly id: string;
    readonly username: string;
  } | null;
  readonly rejectedById?: string | null;
  readonly rejectedBy?: {
    readonly id: string;
    readonly username: string;
  } | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
