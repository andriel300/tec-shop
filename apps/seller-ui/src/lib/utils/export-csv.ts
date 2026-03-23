export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string;
};

const escapeCell = (val: string): string =>
  val.includes(',') || val.includes('"') || val.includes('\n')
    ? `"${val.replace(/"/g, '""')}"`
    : val;

const buildCsv = <T>(rows: T[], columns: CsvColumn<T>[]): string => {
  const headers = columns.map((c) => escapeCell(c.header));
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(c.value(row))).join(',')
  );
  return [headers.join(','), ...body].join('\n');
};

export const exportCSV = <T>(
  rows: T[],
  columns: CsvColumn<T>[],
  filename: string
): void => {
  const csv = buildCsv(rows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
