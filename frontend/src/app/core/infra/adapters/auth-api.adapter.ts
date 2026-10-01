import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IAuthResponseModel } from '../../domain/models/auth-response.model';
import { IAuthCredentialsModel } from '../../domain/models/auth-credentials.model';
import { URL } from '../tokens/url.token';
import { IAuthApiPort } from '../../domain/ports/apis/auth-api.port';

@Injectable({
  providedIn: 'root',
})
export class AuthApiAdapter implements IAuthApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/auth`;

  async login(credentials: IAuthCredentialsModel): Promise<IAuthResponseModel> {
    try {
      return await firstValueFrom(
        this.http.post<IAuthResponseModel>(this.baseUrl, credentials, {
          withCredentials: true,
        }),
      );
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  async refresh(): Promise<IAuthResponseModel> {
    try {
      return await firstValueFrom(
        this.http.post<IAuthResponseModel>(
          `${this.baseUrl}/refresh`,
          {},
          { withCredentials: true },
        ),
      );
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  async logout(): Promise<Omit<IAuthResponseModel, 'mustChangePassword'>> {
    try {
      return await firstValueFrom(
        this.http.post<IAuthResponseModel>(`${this.baseUrl}/logout`, {}, {withCredentials: true}),
      );
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  private normalizeError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return new Error(
          'Ops! Ocorreu um erro inesperado ao conectar com o servidor.',
        );
      }

      const errorBody = err.error as { message?: string | string[] };

      if (errorBody && errorBody.message) {
        const message = Array.isArray(errorBody.message)
          ? errorBody.message[0]
          : errorBody.message;

        return new Error(message);
      }
    }

    if (err instanceof Error) {
      if (err.message.includes('Failed to fetch')) {
        return new Error(
          'Ops! Ocorreu um erro inesperado ao conectar com o servidor.',
        );
      }
      return err;
    }

    return new Error(
      'Ops! Ocorreu um erro inesperado ao conectar com o servidor.',
    );
  }
}
