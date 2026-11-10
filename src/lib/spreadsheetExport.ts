/**
 * Spreadsheet Export & Conversion Engine (Pure TypeScript, Zero External Dependencies)
 * Generates official Microsoft XML Spreadsheet 2003 (.xls) files natively supported
 * by Microsoft Excel, Google Sheets, Apple Numbers, and LibreOffice Calc.
 */

export interface SpreadsheetData {
  title?: string;
  sheetName?: string;
  headers: string[];
  rows: (string | number)[][];
}

function escapeXml(val: string | number): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isNumeric(val: any): boolean {
  if (val === '' || val === null || val === undefined) return false;
  const num = Number(val);
  return !isNaN(num) && isFinite(num);
}

/**
 * Builds standard Microsoft XML Spreadsheet format (.xls) with professional styling.
 */
export function generateXlsXml(data: SpreadsheetData): string {
  const sheetTitle = data.title || data.sheetName || 'Sheet1';
  const cleanSheetName = (data.sheetName || 'Sheet1').slice(0, 31).replace(/[:\\\/\?\*\[\]]/g, '_');

  const headerCells = data.headers
    .map(
      (h) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
    )
    .join('');

  const rowsXml = data.rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const num = isNumeric(cell);
          const type = num ? 'Number' : 'String';
          const value = num ? String(Number(cell)) : escapeXml(cell);
          return `<Cell ss:StyleID="${num ? 'NumericCell' : 'NormalCell'}"><Data ss:Type="${type}">${value}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>${escapeXml(sheetTitle)}</Title>
  <Author>e-Mate AI Studio</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0F172A"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Vertical="Center" ss:Horizontal="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0F2744" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F2744"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1E3A8A"/>
   </Borders>
  </Style>
  <Style ss:ID="NormalCell">
   <Alignment ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
  <Style ss:ID="NumericCell">
   <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E2E8F0"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(cleanSheetName)}">
  <Table>
   <Row ss:Height="24">${headerCells}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Creates an Excel (.xls) file Blob ready for download.
 */
export function exportToXlsBlob(data: SpreadsheetData): Blob {
  const xml = generateXlsXml(data);
  return new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
}

/**
 * Parses text (Markdown tables, CSV, TSV, or structured rows) into a clean SpreadsheetData model.
 */
export function parseTextToSpreadsheet(text: string, title?: string): SpreadsheetData {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // 1. Try Markdown table parser (| header 1 | header 2 |)
  const markdownTableLines = lines.filter((l) => l.startsWith('|') && l.endsWith('|'));
  if (markdownTableLines.length >= 2) {
    const headerRow = markdownTableLines[0];
    const headers = headerRow
      .split('|')
      .map((c) => c.trim())
      .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    const rows = markdownTableLines
      .slice(1)
      .filter((l) => !l.match(/^\|[-\s:|]+\|$/)) // skip separator
      .map((l) =>
        l
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      );

    if (headers.length > 0) {
      return {
        title: title || 'Spreadsheet Data',
        sheetName: 'Sheet1',
        headers,
        rows,
      };
    }
  }

  // 2. Try CSV / TSV parser
  const delimiter = lines.some((l) => l.includes('\t')) ? '\t' : ',';
  if (lines.length > 0) {
    const parsedRows = lines.map((line) => {
      // Split respecting simple quotes
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          cells.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim().replace(/^"|"$/g, ''));
      return cells;
    });

    const maxCols = Math.max(...parsedRows.map((r) => r.length));
    const normalizedRows = parsedRows.map((r) => {
      while (r.length < maxCols) r.push('');
      return r;
    });

    const headers = normalizedRows[0] || [];
    const rows = normalizedRows.slice(1);

    return {
      title: title || 'Spreadsheet Data',
      sheetName: 'Sheet1',
      headers: headers.map((h, i) => h || `Column ${i + 1}`),
      rows,
    };
  }

  // Fallback default grid
  return {
    title: title || 'Spreadsheet Data',
    sheetName: 'Sheet1',
    headers: ['Column A', 'Column B', 'Column C'],
    rows: [['', '', '']],
  };
}

/**
 * Converts a spreadsheet back into a formatted Markdown table.
 */
export function spreadsheetToMarkdown(data: SpreadsheetData): string {
  const headerLine = `| ${data.headers.join(' | ')} |`;
  const sepLine = `| ${data.headers.map(() => '---').join(' | ')} |`;
  const rowsLines = data.rows.map((row) => `| ${row.map((c) => String(c ?? '')).join(' | ')} |`);
  return `${headerLine}\n${sepLine}\n${rowsLines.join('\n')}`;
}

/**
 * Converts a spreadsheet to CSV string.
 */
export function spreadsheetToCsv(data: SpreadsheetData): string {
  const escapeCsv = (val: string | number) => {
    const s = String(val ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const headerLine = data.headers.map(escapeCsv).join(',');
  const rowLines = data.rows.map((r) => r.map(escapeCsv).join(','));
  return [headerLine, ...rowLines].join('\n');
}

