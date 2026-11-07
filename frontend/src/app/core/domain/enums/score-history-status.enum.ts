export enum EScoreHistoryStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const SCORE_HISTORY_STATUS_LABELS: Record<EScoreHistoryStatus, string> =
  {
    [EScoreHistoryStatus.PENDING]: 'Pendente',
    [EScoreHistoryStatus.APPROVED]: 'Aprovada',
    [EScoreHistoryStatus.REJECTED]: 'Rejeitada',
  };
