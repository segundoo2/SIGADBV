import { UserEntity } from '../../../domain/entities/user.entity';
import { ApiResponseDto } from './api-response.dto';

export interface AuthResponseDto extends ApiResponseDto<{ user: UserEntity }> {
  mustChangePassword: boolean;
}
