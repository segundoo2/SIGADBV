import { UserEntity } from "../../entities/user.entity";
import { IResponseModel } from "../../models/response.model";

export interface IUsersApiPort {
  findOneByUsername(
    username: string,
    tenantId: string,
  ): Promise<IResponseModel<Omit<UserEntity, 'password'>>>;
}