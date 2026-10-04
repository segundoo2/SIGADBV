import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IScoreHistoryApiPort } from '../../application/ports/apis/score-history-api.port';
import { URL } from '../tokens/url.token';
import { IScoreHistoryEntity } from '../../domain/entities/score-history.entity';
import { IScoreHistoryPayload } from '../../application/models/score-history-payload.model';
import { ApiResponseDto } from './dtos/api-response.dto';

@Injectable({
  providedIn: 'root',
})
export class ScoreHistoryApiAdapter implements IScoreHistoryApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/score-history`;

  async registerUnitScore(
    unitId: string,
    payload: IScoreHistoryPayload,
  ): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiResponseDto<{ newScore: number }>>(
        `${this.baseUrl}/${unitId}`,
        payload,
        { withCredentials: true },
      ),
    );
  }

  async fetchUnitScoreHistory(
    unitId: string,
    limit?: number,
  ): Promise<IScoreHistoryEntity[]> {
    let params = new HttpParams();
    if (limit !== undefined) {
      params = params.set('limit', limit.toString());
    }

    const response = await firstValueFrom(
      this.http.get<ApiResponseDto<IScoreHistoryEntity[]>>(
        `${this.baseUrl}/${unitId}`,
        { withCredentials: true, params },
      ),
    );
    return response.data;
  }
}
