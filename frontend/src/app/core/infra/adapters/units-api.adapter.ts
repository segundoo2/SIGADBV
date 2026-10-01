import { Injectable, inject } from '@angular/core';
import { IUnitEntity } from '../../domain/entities/unit.entity';
import { IUnitsApiPort } from '../../domain/ports/apis/units-api.port';
import { IResponseModel } from '../../domain/models/response.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { URL } from '../tokens/url.token';

@Injectable({ providedIn: 'root' })
export class UnitsApiAdapter implements IUnitsApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/units`;

  async getAllUnits(): Promise<IResponseModel<IUnitEntity[]>> {
    return await firstValueFrom(
      this.http.get<IResponseModel<IUnitEntity[]>>(this.baseUrl, {
        withCredentials: true,
      }),
    );
  }
}
