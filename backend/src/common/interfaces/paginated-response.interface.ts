import { IPaginatedMeta } from './paginated-data.interface';
import { IResponse } from './response.interface';

export interface IPaginatedResponse<T> extends IResponse<T> {
  meta: IPaginatedMeta;
}
