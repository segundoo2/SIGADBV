import { IUpdatePasswordInput } from '../../models/update-password-input.model';

export interface IUpdatePasswordApiPort {
  updatePassword(input: IUpdatePasswordInput): Promise<void>;
}
