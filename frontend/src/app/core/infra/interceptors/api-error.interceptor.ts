import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { EErrorsGlobal } from '../../application/enums/errors-global.enum';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getErrorMessage(error: HttpErrorResponse): string {
  const body: unknown = error.error;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {
    const payload = body as Record<string, unknown>;
    const message = payload['message'];

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (
      Array.isArray(message) &&
      message.every((item): item is string => typeof item === 'string')
    ) {
      return message.join(', ');
    }

    const errorLabel = payload['error'];
    if (typeof errorLabel === 'string' && errorLabel.trim()) {
      return errorLabel;
    }
  }

  if (error.status === 0) {
    return EErrorsGlobal.SERVER_ERROR;
  }

  return `Erro na requisição (HTTP ${error.status}).`;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        return throwError(
          () => new ApiError(getErrorMessage(error), error.status),
        );
      }

      return throwError(() => error);
    }),
  );
