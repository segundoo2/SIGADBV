import { IUnitEntity } from "../../entities/unit.entity";
import { IResponseModel } from "../../models/response.model";

export interface IUnitsApiPort {
  getAllUnits(): Promise<IResponseModel<IUnitEntity[]>>;
}