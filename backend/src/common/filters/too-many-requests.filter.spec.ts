import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { EErrorsGlobal } from '../enum/global/errors-global.enum';
import { TooManyRequestsExceptionFilter } from './too-many-requests.filter';

describe('TooManyRequestsExceptionFilter', () => {
  let filter: TooManyRequestsExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new TooManyRequestsExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => ({}),
        getNext: () => ({}),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should catch TOO_MANY_REQUESTS exception and return the global many requests message', () => {
    const exception = new HttpException(
      'Rate limit exceeded',
      HttpStatus.TOO_MANY_REQUESTS,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.TOO_MANY_REQUESTS,
      message: EErrorsGlobal.MANY_REQUESTS,
    });
  });

  it('should catch generic HttpException with string response', () => {
    const exception = new HttpException(
      'Bad request details',
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Bad request details',
    });
  });

  it('should catch generic HttpException with object response containing a message', () => {
    const exception = new HttpException(
      { message: 'Object error message' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Object error message',
    });
  });

  it('should catch unknown non-HttpException errors and return internal server error', () => {
    const exception = new Error('Unexpected database crash');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Ocorreu um erro inesperado.',
    });
  });
});
