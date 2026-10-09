import { UserEntity } from '../../domain/entities/user.entity';
import { IApiResponseModel } from './api-response.model';

export interface IAuthResponseModel extends IApiResponseModel<{
  user: UserEntity;
}> {
  mustChangePassword: boolean;
}
