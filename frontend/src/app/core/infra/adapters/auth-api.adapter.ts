import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthCredentialsModel, IAuthResponseModel } from '../../domain/models/auth.model';
import { IAuthApiPort } from '../../domain/ports/auth-api.port';
import { environment } from '../../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class AuthApiAdapter implements IAuthApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  async login(credentials: AuthCredentialsModel): Promise<IAuthResponseModel> {
    return firstValueFrom(
      this.http.post<IAuthResponseModel>(this.baseUrl, credentials)
    );
  }

  async refresh(): Promise<IAuthResponseModel> {
    return firstValueFrom(
      this.http.post<IAuthResponseModel>(`${this.baseUrl}/refresh`, {})
    );
  }

  async logout(): Promise<IAuthResponseModel> {
    return firstValueFrom(
      this.http.post<IAuthResponseModel>(`${this.baseUrl}/logout`, {})
    );
  }
}
