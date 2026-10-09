import { describe, expect, it } from 'vitest';
import { generateReportHtml } from './unit-report.template';
import { ReportConfig } from '../../core/application/models/pdf-report.model';

interface TestItem {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
}

describe('generateReportHtml', () => {
  it('should generate HTML containing title, subtitle, headers, and rendered data rows', () => {
    const config: ReportConfig<TestItem> = {
      title: 'Relatório de Teste',
      subtitle: 'Subtítulo descritivo',
      columns: [
        { header: 'ID', field: 'id', className: 'font-mono' },
        { header: 'Nome', field: 'name' },
        {
          header: 'Estado',
          render: (item) => (item.active ? 'Ativo' : 'Inativo'),
        },
      ],
      data: [
        { id: '001', name: 'Alpha', active: true },
        { id: '002', name: 'Beta', active: false },
      ],
    };

    const html = generateReportHtml(config);

    expect(html).toContain('Relatório de Teste');
    expect(html).toContain('Subtítulo descritivo');
    expect(html).toContain('ID');
    expect(html).toContain('Nome');
    expect(html).toContain('Estado');
    expect(html).toContain('Alpha');
    expect(html).toContain('Ativo');
    expect(html).toContain('Beta');
    expect(html).toContain('Inativo');
    expect(html).toContain('window.print()');
  });

  it('should render empty state message when data array is empty', () => {
    const config: ReportConfig<TestItem> = {
      title: 'Relatório Vazio',
      columns: [
        { header: 'ID', field: 'id' },
        { header: 'Nome', field: 'name' },
      ],
      data: [],
    };

    const html = generateReportHtml(config);

    expect(html).toContain('Relatório Vazio');
    expect(html).toContain('Nenhum registo encontrado para este relatório.');
  });
});
