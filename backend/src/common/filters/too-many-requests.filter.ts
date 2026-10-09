import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EErrorsGlobal } from '../enum/global/errors-global.enum';

@Catch()
export class TooManyRequestsExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro inesperado.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        message = EErrorsGlobal.MANY_REQUESTS;
      } else if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object' && errorResponse !== null) {
        message = (errorResponse as { message?: string }).message || message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
    });
  }
}
