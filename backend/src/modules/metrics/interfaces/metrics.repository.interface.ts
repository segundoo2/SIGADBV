export interface IMetricsRepository {
  findListScoreUnits(
    tenantId: string,
  ): Promise<{ name: string; score: number }[]>;
}
