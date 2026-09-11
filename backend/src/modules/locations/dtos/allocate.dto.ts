export class AllocateDto {
  productId!: string;
  targetLocationId!: string;
  sourceLocationId?: string;
  quantity!: number;
  tenantId!: string;
}
