import { EErrorsGlobal } from '../enums/errors-global.enum';

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return EErrorsGlobal.SERVER_ERROR;
}
