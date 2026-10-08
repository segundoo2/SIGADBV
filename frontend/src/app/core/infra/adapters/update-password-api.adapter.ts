import { HttpClient } from '@angular/common/http';
import { IUpdatePasswordInput } from '../../application/models/update-password-input.model';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { URL } from '../tokens/url.token';
import { IUpdatePasswordApiPort } from '../../application/ports/apis/update-password-api.port';
import { IApiResponseModel } from '../../application/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class UpdatePasswordApiAdapter implements IUpdatePasswordApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/users`;

  async updatePassword(input: IUpdatePasswordInput): Promise<void> {
    await firstValueFrom(
      this.http.patch<IApiResponseModel<null>>(this.baseUrl, input, {
        withCredentials: true,
      }),
    );
  }
}
