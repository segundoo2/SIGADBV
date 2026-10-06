import { InjectionToken } from '@angular/core';
import { IScoreHistoryApiPort } from '../../application/ports/apis/score-history-api.port';
import { IScoreHistoryStorePort } from '../../application/ports/stores/score-history-store.port';

export const SCORE_HISTORY_STORE_PORT =
  new InjectionToken<IScoreHistoryStorePort>('SCORE_HISTORY_STORE_PORT');

export const SCORE_HISTORY_API_PORT = new InjectionToken<IScoreHistoryApiPort>(
  'SCORE_HISTORY_API_PORT',
);
