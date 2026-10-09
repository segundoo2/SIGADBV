import { Injectable } from '@angular/core';
import { IPdfReportPort } from '../../application/ports/pdf-report.port';

@Injectable({
  providedIn: 'root',
})
export class PdfReportBrowserAdapter implements IPdfReportPort {
  openReportWindow(htmlContent: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
