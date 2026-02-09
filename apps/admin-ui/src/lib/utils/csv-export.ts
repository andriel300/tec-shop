/**
 * CSV Export Utility
 * Generates and downloads CSV files from data arrays
 */

interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  transform?: (value: unknown, row: T) => string;
}

/**
 * Exports an array of data to a CSV file and triggers download
 * @param data - Array of objects to export
 * @param columns - Column configuration with keys and headers
 * @param filename - Name of the downloaded file (without extension)
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  if (!data.length) {
    return;
  }

  // Generate header row
  const headers = columns.map((col) => escapeCSVValue(col.header));

  // Generate data rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = getNestedValue(row, col.key as string);
      const transformedValue = col.transform
        ? col.transform(value, row)
        : formatValue(value);
      return escapeCSVValue(transformedValue);
    })
  );

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  // Create blob and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Gets a nested value from an object using dot notation
 * @example getNestedValue({ shop: { name: 'Test' } }, 'shop.name') => 'Test'
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Formats a value for CSV output
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Escapes a value for CSV (handles commas, quotes, and newlines)
 */
function escapeCSVValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Pre-configured column definitions for common exports
 */
export const sellerColumns: CsvColumn<Record<string, unknown>>[] = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'phoneNumber', header: 'Phone' },
  { key: 'country', header: 'Country' },
  { key: 'shop.businessName', header: 'Shop Name' },
  { key: 'shop.category', header: 'Shop Category' },
  {
    key: 'isVerified',
    header: 'Verified',
    transform: (value) => (value ? 'Yes' : 'No'),
  },
  {
    key: 'createdAt',
    header: 'Joined Date',
    transform: (value) => (value ? new Date(value as string).toLocaleDateString() : ''),
  },
];

export const categoryColumns: CsvColumn<Record<string, unknown>>[] = [
  { key: 'name', header: 'Name' },
  { key: 'slug', header: 'Slug' },
  { key: 'description', header: 'Description' },
  {
    key: 'isActive',
    header: 'Active',
    transform: (value) => (value ? 'Yes' : 'No'),
  },
];

export const brandColumns: CsvColumn<Record<string, unknown>>[] = [
  { key: 'name', header: 'Name' },
  { key: 'slug', header: 'Slug' },
  { key: 'description', header: 'Description' },
  {
    key: 'isActive',
    header: 'Active',
    transform: (value) => (value ? 'Yes' : 'No'),
  },
];
