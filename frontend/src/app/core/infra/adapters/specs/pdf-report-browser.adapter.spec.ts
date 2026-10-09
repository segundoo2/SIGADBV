import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PdfReportBrowserAdapter } from '../pdf-report-browser.adapter';

describe('PdfReportBrowserAdapter', () => {
  let adapter: PdfReportBrowserAdapter;
  let mockWindow: {
    document: {
      open: ReturnType<typeof vi.fn>;
      write: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    adapter = new PdfReportBrowserAdapter();

    mockWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn(),
      },
    };

    // Mock do window.open global do browser
    vi.spyOn(window, 'open').mockReturnValue(mockWindow as unknown as Window);
  });

  it('should create the adapter', () => {
    expect(adapter).toBeTruthy();
  });

  it('should open a new window, write HTML content, and close document stream', () => {
    const htmlContent = '<html><body>Relatório de Teste</body></html>';

    adapter.openReportWindow(htmlContent);

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(mockWindow.document.open).toHaveBeenCalledOnce();
    expect(mockWindow.document.write).toHaveBeenCalledWith(htmlContent);
    expect(mockWindow.document.close).toHaveBeenCalledOnce();
  });

  it('should not throw errors if window.open returns null (popup blocked)', () => {
    vi.spyOn(window, 'open').mockReturnValue(null);

    const htmlContent = '<html><body>Teste Bloqueado</body></html>';

    expect(() => adapter.openReportWindow(htmlContent)).not.toThrow();
    expect(mockWindow.document.open).not.toHaveBeenCalled();
    expect(mockWindow.document.write).not.toHaveBeenCalled();
  });
});
