export class ValidateAllocationDto {
  productId!: string;
  targetLocationId!: string;
  sourceLocationId?: string;
  quantity!: number;
  tenantId!: string;
  currentProductStock!: number;
}
