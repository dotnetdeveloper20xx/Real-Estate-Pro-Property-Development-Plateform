import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

/**
 * Parsed CSV row for validation display.
 */
interface ICsvRow {
  readonly rowNumber: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly roles: string;
  readonly errors: string[];
  readonly valid: boolean;
}

/**
 * Import result summary.
 */
interface IImportResult {
  readonly successCount: number;
  readonly errorCount: number;
  readonly errors: Array<{ row: number; message: string }>;
}

/**
 * CSV Bulk Import Dialog Component
 *
 * Features:
 * - File upload accepting CSV format
 * - Validate columns: FirstName, LastName, Email, Password, Roles
 * - Row-level validation with error display
 * - Import valid rows, report errors for invalid rows
 *
 * Requirements: 4.9
 */
@Component({
  selector: 'app-bulk-import-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <dialog class="modal" [class.modal-open]="open">
      <div class="modal-box w-full max-w-2xl">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-info">upload_file</span>
          </div>
          <div>
            <h3 class="text-lg font-bold">Import Users from CSV</h3>
            <p class="text-xs text-base-content/60">Upload a CSV file to bulk-create user accounts</p>
          </div>
        </div>

        <!-- File Upload Section -->
        <div *ngIf="!parsedRows.length && !importResult" class="space-y-4">
          <div class="border-2 border-dashed border-base-300 rounded-lg p-8 text-center
            hover:border-primary/50 transition-colors cursor-pointer"
            (click)="fileInput.click()"
            (dragover)="onDragOver($event)"
            (drop)="onDrop($event)">
            <span class="material-symbols-outlined text-4xl text-base-content/30 mb-2">cloud_upload</span>
            <p class="text-sm text-base-content/70">
              Drag and drop your CSV file here, or click to browse
            </p>
            <p class="text-xs text-base-content/50 mt-1">Accepts .csv files only</p>
            <input #fileInput type="file" accept=".csv" class="hidden"
              (change)="onFileSelected($event)" />
          </div>

          <!-- Expected format info -->
          <div class="alert alert-info text-sm">
            <span class="material-symbols-outlined text-sm">info</span>
            <div>
              <p class="font-medium">Expected CSV format:</p>
              <code class="text-xs">FirstName,LastName,Email,Password,Roles</code>
              <p class="text-xs mt-1">Roles should be semicolon-separated (e.g., "Admin;ProjectManager")</p>
            </div>
          </div>
        </div>

        <!-- Parsed Rows Preview -->
        <div *ngIf="parsedRows.length > 0 && !importResult" class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">
              {{ validCount }} valid, {{ invalidCount }} invalid of {{ parsedRows.length }} rows
            </p>
            <button class="btn btn-ghost btn-xs" (click)="resetFile()">
              <span class="material-symbols-outlined text-sm">close</span> Clear
            </button>
          </div>

          <!-- Validation summary -->
          <div class="overflow-x-auto max-h-64 overflow-y-auto">
            <table class="table table-xs">
              <thead>
                <tr class="bg-base-200/50">
                  <th>Row</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of parsedRows" [class.bg-error/5]="!row.valid">
                  <td class="text-xs">{{ row.rowNumber }}</td>
                  <td class="text-xs">{{ row.firstName }} {{ row.lastName }}</td>
                  <td class="text-xs">{{ row.email }}</td>
                  <td class="text-xs">{{ row.roles }}</td>
                  <td>
                    <span *ngIf="row.valid" class="badge badge-xs badge-success">Valid</span>
                    <div *ngIf="!row.valid" class="tooltip" [attr.data-tip]="row.errors.join(', ')">
                      <span class="badge badge-xs badge-error cursor-help">
                        {{ row.errors.length }} error(s)
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Error details -->
          <div *ngIf="invalidCount > 0" class="alert alert-warning text-xs">
            <span class="material-symbols-outlined text-sm">warning</span>
            <span>Invalid rows will be skipped. Only valid rows will be imported.</span>
          </div>
        </div>

        <!-- Import Result -->
        <div *ngIf="importResult" class="space-y-4">
          <div class="alert" [ngClass]="importResult.errorCount === 0 ? 'alert-success' : 'alert-warning'">
            <span class="material-symbols-outlined text-sm">
              {{ importResult.errorCount === 0 ? 'check_circle' : 'warning' }}
            </span>
            <div>
              <p class="font-medium">Import Complete</p>
              <p class="text-xs">
                {{ importResult.successCount }} users created successfully.
                {{ importResult.errorCount > 0 ? importResult.errorCount + ' rows failed.' : '' }}
              </p>
            </div>
          </div>

          <div *ngIf="importResult.errors.length > 0" class="overflow-y-auto max-h-40">
            <p class="text-xs font-medium mb-1">Failed rows:</p>
            <div *ngFor="let err of importResult.errors" class="text-xs text-error py-0.5">
              Row {{ err.row }}: {{ err.message }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-action">
          <button class="btn btn-ghost" (click)="onClose()" [disabled]="importing">
            {{ importResult ? 'Close' : 'Cancel' }}
          </button>
          <button *ngIf="parsedRows.length > 0 && !importResult"
            class="btn btn-primary" (click)="onImport()"
            [disabled]="importing || validCount === 0">
            <span *ngIf="importing" class="loading loading-spinner loading-sm"></span>
            Import {{ validCount }} User(s)
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button (click)="onClose()">close</button>
      </form>
    </dialog>
  `
})
export class BulkImportDialogComponent {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);

  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() importComplete = new EventEmitter<void>();

  parsedRows: ICsvRow[] = [];
  importResult: IImportResult | null = null;
  importing = false;

  private readonly requiredColumns = ['firstname', 'lastname', 'email', 'password', 'roles'];

  get validCount(): number {
    return this.parsedRows.filter(r => r.valid).length;
  }

  get invalidCount(): number {
    return this.parsedRows.filter(r => !r.valid).length;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.parseFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.parseFile(event.dataTransfer.files[0]);
    }
  }

  onImport(): void {
    const validRows = this.parsedRows.filter(r => r.valid);
    if (validRows.length === 0) return;

    this.importing = true;

    const payload = validRows.map(row => ({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      password: row.password,
      roles: row.roles.split(';').map(r => r.trim()).filter(r => r)
    }));

    this.http.post<IImportResult>('/api/v1/users/bulk-import', { users: payload }).subscribe({
      next: (result) => {
        this.importResult = result;
        this.importing = false;
        if (result.successCount > 0) {
          this.toast.showSuccess(`${result.successCount} user(s) imported successfully`);
          this.importComplete.emit();
        }
      },
      error: () => {
        this.importing = false;
        this.toast.showError('Import failed. Please try again.');
      }
    });
  }

  onClose(): void {
    this.resetFile();
    this.importResult = null;
    this.close.emit();
  }

  resetFile(): void {
    this.parsedRows = [];
    this.importResult = null;
  }

  private parseFile(file: File): void {
    if (!file.name.endsWith('.csv')) {
      this.toast.showError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      this.parseCSV(content);
    };
    reader.readAsText(file);
  }

  private parseCSV(content: string): void {
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 2) {
      this.toast.showError('CSV file must contain a header row and at least one data row');
      return;
    }

    // Validate header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const missingColumns = this.requiredColumns.filter(c => !headers.includes(c));
    if (missingColumns.length > 0) {
      this.toast.showError(`Missing columns: ${missingColumns.join(', ')}`);
      return;
    }

    const colIndex = {
      firstName: headers.indexOf('firstname'),
      lastName: headers.indexOf('lastname'),
      email: headers.indexOf('email'),
      password: headers.indexOf('password'),
      roles: headers.indexOf('roles')
    };

    // Parse data rows
    this.parsedRows = lines.slice(1).map((line, idx) => {
      const cols = this.parseCsvLine(line);
      const row: ICsvRow = {
        rowNumber: idx + 2,
        firstName: cols[colIndex.firstName]?.trim() ?? '',
        lastName: cols[colIndex.lastName]?.trim() ?? '',
        email: cols[colIndex.email]?.trim() ?? '',
        password: cols[colIndex.password]?.trim() ?? '',
        roles: cols[colIndex.roles]?.trim() ?? '',
        errors: [],
        valid: true
      };

      const errors = this.validateRow(row);
      return { ...row, errors, valid: errors.length === 0 };
    });
  }

  private validateRow(row: ICsvRow): string[] {
    const errors: string[] = [];

    if (!row.firstName) errors.push('First name is required');
    if (!row.lastName) errors.push('Last name is required');
    if (!row.email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push('Invalid email format');
    }
    if (!row.password) {
      errors.push('Password is required');
    } else if (row.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }

    return errors;
  }

  /** Parse a CSV line handling quoted values. */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
