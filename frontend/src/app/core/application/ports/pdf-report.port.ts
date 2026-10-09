export interface IPdfReportPort {
  openReportWindow(htmlContent: string): void;
}
export const PDF_REPORT_PORT = Symbol('PDF_REPORT_PORT');
