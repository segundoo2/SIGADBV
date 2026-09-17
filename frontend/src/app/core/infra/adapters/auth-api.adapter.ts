import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IAuthApiPort } from '../../domain/ports/auth-api.port';
import { environment } from '../../../../environments/environments';
import { IAuthResponseModel } from '../../domain/models/auth-response.model';
import { IAuthCredentialsModel } from '../../domain/models/auth-credentials.model';

@Injectable({
  providedIn: 'root',
})
export class AuthApiAdapter implements IAuthApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  async login(credentials: IAuthCredentialsModel): Promise<IAuthResponseModel> {
    try {
      return await firstValueFrom(
        this.http.post<IAuthResponseModel>(this.baseUrl, credentials),
      );
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  async refresh(): Promise<IAuthResponseModel> {
    try {
      return await firstValueFrom(
        this.http.post<IAuthResponseModel>(`${this.baseUrl}/refresh`, {}),
      );
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  async logout(): Promise<Omit<IAuthResponseModel, 'mustChangePassword'>> {
    try {
      return await firstValueFrom(
        this.http.post<IAuthResponseModel>(`${this.baseUrl}/logout`, {}),
      );
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const errorBody = err.error as { message?: string | string[] };
      
      if (errorBody && errorBody.message) {
        const message = Array.isArray(errorBody.message)
          ? errorBody.message[0]
          : errorBody.message;
        
        return new Error(message);
      }
    }

    if (err instanceof Error) {
      return err;
    }

    return new Error('Ops! Ocorreu um erro inesperado ao conectar com o servidor.');
  }
}