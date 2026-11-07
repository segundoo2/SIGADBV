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

  it('should escape user-controlled values in title, subtitle, headers, fields, and rendered cells', () => {
    const config: ReportConfig<TestItem> = {
      title: '<script>alert("title")</script>',
      subtitle: '<img src=x onerror=alert(1)>',
      columns: [
        { header: '<svg onload=alert(1)>', field: 'name' },
        { header: 'Rendered', render: () => '<script>alert("cell")</script>' },
      ],
      data: [{ id: '1', name: `O'Neil & <b>Team</b>`, active: true }],
    };

    const html = generateReportHtml(config);

    expect(html).toContain(
      '&lt;script&gt;alert(&quot;title&quot;)&lt;/script&gt;',
    );
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;svg onload=alert(1)&gt;');
    expect(html).toContain('O&#39;Neil &amp; &lt;b&gt;Team&lt;/b&gt;');
    expect(html).toContain(
      '&lt;script&gt;alert(&quot;cell&quot;)&lt;/script&gt;',
    );
    expect(html).not.toContain('<script>alert("cell")</script>');
  });
});
