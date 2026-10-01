import { IResponseModel } from "../../models/response.model";
import { IUpdatePasswordDto } from "../../models/update-password-dto.model";

export interface IUpdatePasswordStorePort {
  readonly isLoading: () => boolean;
  readonly successMessage: () => string;
  readonly error: () => string | null;

  updatePassword(updatePassword: IUpdatePasswordDto): Promise<IResponseModel<null>>;
}