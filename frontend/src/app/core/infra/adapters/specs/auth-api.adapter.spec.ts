import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { AuthenticationApiAdapter } from '../auth-api.adapter';
import { IAuthCredentialsModel } from '../../../application/models/auth-credentials.model';
import { AuthResponseDto } from '../dtos/auth-response.dto';
import { UserEntity } from '../../../domain/entities/user.entity';
import { URL } from '../../tokens/url.token';

describe('AuthApiAdapter', () => {
  let adapter: AuthenticationApiAdapter;
  let httpMock: HttpTestingController;
  const baseUrl = `${URL}/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthenticationApiAdapter,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    adapter = TestBed.inject(AuthenticationApiAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const mockUser: UserEntity = {
    id: 'user-id',
    tenantId: 'tenant-id',
    username: 'john.doe',
    mustChangePassword: false,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should send POST request with credentials on login and return response', async () => {
    const credentials: IAuthCredentialsModel = {
      username: 'john.doe',
      password: 'securePassword123',
    };

    const mockResponse: AuthResponseDto = {
      message: 'Login successful',
      mustChangePassword: true,
      data: { user: mockUser },
    };

    const loginPromise = adapter.login(credentials);

    const req = httpMock.expectOne(`${baseUrl}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(credentials);

    req.flush(mockResponse);

    const result = await loginPromise;
    expect(result).toEqual({ user: mockUser, mustChangePassword: true });
  });

  it('should send POST request to refresh token endpoint', async () => {
    const mockResponse: AuthResponseDto = {
      message: 'Session refreshed successfully',
      mustChangePassword: true,
      data: { user: mockUser },
    };

    const refreshPromise = adapter.refresh();

    const req = httpMock.expectOne(`${baseUrl}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush(mockResponse);

    const result = await refreshPromise;
    expect(result).toEqual({ user: mockUser, mustChangePassword: true });
  });

  it('should send POST request to logout endpoint', async () => {
    const mockResponse = { message: 'Logout successful' };

    const logoutPromise = adapter.logout();

    const req = httpMock.expectOne(`${baseUrl}/logout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});

    req.flush(mockResponse);

    await expect(logoutPromise).resolves.toBeUndefined();
  });
});
