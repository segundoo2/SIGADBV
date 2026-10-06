import { IUpdatePasswordInput } from '../../models/update-password-input.model';

export interface IUpdatePasswordStorePort {
  readonly isLoading: () => boolean;
  readonly successMessage: () => string;
  readonly error: () => string | null;

  updatePassword(input: IUpdatePasswordInput): Promise<void>;
}
