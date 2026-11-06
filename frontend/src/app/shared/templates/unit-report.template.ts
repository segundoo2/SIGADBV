import { ReportConfig } from '../../core/application/models/pdf-report.model';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export function generateReportHtml<T>(config: ReportConfig<T>): string {
  const rowsHtml =
    config.data.length > 0
      ? config.data
          .map((item) => {
            const cells = config.columns
              .map((col) => {
                const content = col.render
                  ? col.render(item)
                  : col.field
                    ? String(item[col.field] ?? '-')
                    : '-';
                const className = [
                  col.className || 'text-slate-700',
                  col.classNameFor?.(item),
                ]
                  .filter(Boolean)
                  .join(' ');
                return `<td class="py-2.5 px-3 ${escapeHtml(className)}">${escapeHtml(content)}</td>`;
              })
              .join('');
            return `<tr class="even:bg-slate-50 border-b border-slate-200">${cells}</tr>`;
          })
          .join('')
      : `<tr><td colspan="${config.columns.length}" class="text-center py-8 text-slate-400">Nenhum registo encontrado para este relatório.</td></tr>`;

  const headersHtml = config.columns
    .map(
      (col) =>
        `<th class="py-2.5 px-3 font-semibold text-left">${escapeHtml(col.header)}</th>`,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${escapeHtml(config.title)}</title>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
        </style>
      </head>
      <body class="bg-white text-slate-900 p-6 font-sans">
        <header class="mb-6 border-b-2 border-slate-200 pb-4 flex justify-between items-end">
          <div>
            <h1 class="text-xl font-bold text-slate-900 mb-1">${escapeHtml(config.title)}</h1>
            ${config.subtitle ? `<p class="text-xs text-slate-500">${escapeHtml(config.subtitle)}</p>` : ''}
          </div>
          <div class="text-xs text-slate-400 text-right">
            Gerado em: ${new Date().toLocaleString('pt-BR')}
          </div>
        </header>

        <main>
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-100 text-slate-600 uppercase tracking-wider border-b-2 border-slate-300">
                ${headersHtml}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </main>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
            }, 400);
          };
        </script>
      </body>
    </html>
  `;
}
