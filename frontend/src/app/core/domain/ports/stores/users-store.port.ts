import { UserEntity } from "../../entities/user.entity";
import { IResponseModel } from "../../models/response.model";

export interface IUsersStorePort {
  findOneByUsername(
    username: string,
    tenantId: string,
  ): Promise<IResponseModel<Omit<UserEntity, 'password'>>>;
}