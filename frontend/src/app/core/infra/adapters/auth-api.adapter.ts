import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { IAuthCredentialsModel } from '../../application/models/auth-credentials.model';
import { IAuthSession } from '../../application/models/auth-session.model';
import { IAuthApiPort } from '../../application/ports/apis/auth-api.port';
import { URL } from '../tokens/url.token';
import { AuthResponseDto } from '../../application/models/auth-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationApiAdapter implements IAuthApiPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${URL}/auth`;

  async login(credentials: IAuthCredentialsModel): Promise<IAuthSession> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(this.baseUrl, credentials, {
          withCredentials: true,
        }),
      );
      return this.toAuthSession(response);
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  async refresh(): Promise<IAuthSession> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponseDto>(
          `${this.baseUrl}/refresh`,
          {},
          { withCredentials: true },
        ),
      );
      return this.toAuthSession(response);
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<{ message: string }>(
          `${this.baseUrl}/logout`,
          {},
          { withCredentials: true },
        ),
      );
    } catch (err: unknown) {
      throw this.normalizeError(err);
    }
  }

  private toAuthSession(response: AuthResponseDto): IAuthSession {
    return {
      user: response.data.user,
      mustChangePassword: response.mustChangePassword,
    };
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
