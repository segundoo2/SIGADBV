import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthCredentialsModel, IAuthResponseModel } from '../../domain/models/auth.model';
import { IAuthApiPort } from '../../domain/ports/auth-api.port';

@Injectable({
  providedIn: 'root',
})
export class AuthApiAdapter implements IAuthApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/auth';

  async login(credentials: AuthCredentialsModel): Promise<IAuthResponseModel> {
    return firstValueFrom(
      this.http.post<IAuthResponseModel>(`${this.baseUrl}/login`, credentials)
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