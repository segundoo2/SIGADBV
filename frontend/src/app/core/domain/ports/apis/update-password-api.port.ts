import { IResponseModel } from "../../models/response.model";
import { IUpdatePasswordDto } from "../../models/update-password-dto.model";

export interface  IUpdatePasswordApiPort {
  updatePassword(updatePassword: IUpdatePasswordDto): Promise<IResponseModel<null>>;
}