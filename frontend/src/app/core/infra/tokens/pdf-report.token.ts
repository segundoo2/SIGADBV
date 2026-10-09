import { InjectionToken } from '@angular/core';
import { IPdfReportPort } from '../../application/ports/pdf-report.port';

export const PDF_REPORT_PORT = new InjectionToken<IPdfReportPort>(
  'PDF_REPORT_PORT',
);
