import { EErrorsGlobal } from '../../domain/enums/errors-global.enum';

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return EErrorsGlobal.SERVER_ERROR;
}
