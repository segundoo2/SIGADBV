import { UserEntity } from "../entities/user.entity";
import { IResponseModel } from "./response.model";

export interface IAuthResponseModel extends IResponseModel<{ user: Omit<UserEntity, 'password'> }> {
  mustChangePassword: boolean;
}