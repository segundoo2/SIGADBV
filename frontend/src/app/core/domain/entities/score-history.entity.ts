export enum EScoreHistoryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IScoreHistoryEntity {
  readonly id: string;
  readonly tenantId: string;
  readonly unitId: string;
  readonly score: number;
  readonly description: string;
  readonly status: EScoreHistoryStatus;
  readonly requestedById: string;
  readonly approvedById?: string | null;
  readonly rejectedById?: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}