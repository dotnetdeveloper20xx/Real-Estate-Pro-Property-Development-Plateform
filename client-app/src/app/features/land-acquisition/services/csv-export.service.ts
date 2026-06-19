import { Injectable } from '@angular/core';

import { IOpportunityListItem } from '../models';

/**
 * Column definition for CSV generation.
 * Supports custom value transformation via optional transform function.
 */
export interface IColumnDef {
  readonly key: string;
  readonly header: string;
  readonly transform?: (value: unknown) => string;
}

/**
 * Pure utility service for generating and downloading CSV files.
 * Implements RFC 4180 compliance for value escaping:
 * - Values containing commas, double quotes, or newlines are wrapped in double quotes
 * - Internal double quotes are escaped by doubling them (" → "")
 */
@Injectable({ providedIn: 'root' })
export class CsvExportService {

  /** Default columns for opportunity exports. */
  private readonly opportunityColumns: readonly IColumnDef[] = [
    { key: 'name', header: 'Name' },
    { key: 'location', header: 'Location' },
    { key: 'landSize', header: 'Land Size (acres)', transform: (v) => String(v ?? '') },
    { key: 'status', header: 'Status' },
    { key: 'source', header: 'Source' },
    { key: 'expectedAcquisition', header: 'Expected Acquisition' },
    { key: 'createdAt', header: 'Created Date', transform: (v) => v ? new Date(v as string).toLocaleDateString('en-GB') : '' }
  ];

  /**
   * Generate a CSV string from column definitions and row data.
   * Produces a header row followed by data rows with RFC 4180 escaping.
   */
  generateCsv(columns: IColumnDef[], rows: Record<string, unknown>[]): string {
    const headerRow = columns.map(col => this.escapeValue(col.header)).join(',');

    const dataRows = rows.map(row =>
      columns.map(col => {
        const rawValue = row[col.key];
        const stringValue = col.transform
          ? col.transform(rawValue)
          : String(rawValue ?? '');
        return this.escapeValue(stringValue);
      }).join(',')
    );

    return [headerRow, ...dataRows].join('\r\n');
  }

  /**
   * Trigger a browser download of the given CSV content.
   * Creates a Blob, generates an object URL, clicks an anchor element, then revokes the URL.
   */
  downloadCsv(csvContent: string, filename?: string): void {
    const resolvedFilename = filename ?? this.generateFilename();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = resolvedFilename;
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  }

  /**
   * Convenience method: generates a CSV from opportunities and triggers download.
   * Uses the default opportunity columns.
   */
  exportOpportunities(opportunities: IOpportunityListItem[]): void {
    const csvContent = this.generateCsv(
      this.opportunityColumns as IColumnDef[],
      opportunities as unknown as Record<string, unknown>[]
    );
    this.downloadCsv(csvContent);
  }

  /**
   * Escape a value per RFC 4180:
   * - If the value contains a comma, double quote, or newline, wrap in double quotes
   * - Double any internal double quotes
   */
  escapeValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }
    return value;
  }

  /** Generate filename in format: opportunities-export-YYYY-MM-DD.csv */
  private generateFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `opportunities-export-${year}-${month}-${day}.csv`;
  }
}
