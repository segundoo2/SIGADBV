export interface ReportColumn<T> {
  readonly header: string;
  readonly field?: keyof T;
  readonly className?: string;
  readonly render?: (item: T) => string;
}

export interface ReportConfig<T> {
  readonly title: string;
  readonly subtitle?: string;
  readonly columns: readonly ReportColumn<T>[];
  readonly data: readonly T[];
}
