import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, from, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AUTH_API_PORT, AUTH_STORE_PORT } from '../tokens/auth.token';
import { IAuthApiPort } from '../../application/ports/apis/auth-api.port';
import { IAuthStorePort } from '../../application/ports/stores/auth-store.port';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const authApi = inject(AUTH_API_PORT);
  const authStore = inject(AUTH_STORE_PORT);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest = /\/auth(?:\/|\?|$)/.test(req.url);

      if (error.status === 401 && !isAuthRequest) {
        return handle401Error(req, next, authApi, authStore, error);
      }

      return throwError(() => error);
    }),
  );
};

function handle401Error(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authApi: IAuthApiPort,
  authStore: IAuthStorePort,
  error: HttpErrorResponse,
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return from(authApi.refresh()).pipe(
      switchMap(() => {
        isRefreshing = false;
        refreshTokenSubject.next(true);
        return next(req);
      }),
      catchError((refreshError: unknown) => {
        isRefreshing = false;
        refreshTokenSubject.next(false);

        const isUnauthorizedRefresh =
          refreshError instanceof HttpErrorResponse &&
          (refreshError.status === 401 || refreshError.status === 403);

        if (isUnauthorizedRefresh) {
          void authStore.logout();
        }

        return throwError(() => refreshError);
      }),
    );
  }

  return refreshTokenSubject.pipe(
    filter((success): success is boolean => success !== null),
    take(1),
    switchMap((success) => {
      if (success) {
        return next(req);
      }
      return throwError(() => error);
    }),
  );
}
