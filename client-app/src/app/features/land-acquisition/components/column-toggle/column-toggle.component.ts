import { Component, ChangeDetectionStrategy, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Configuration for a single table column visibility toggle.
 */
export interface IColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

/** localStorage key for persisting column visibility preferences. */
const STORAGE_KEY = 'be_opportunity_columns';

/** Default column definitions for the opportunity list table. */
const DEFAULT_COLUMNS: IColumnConfig[] = [
  { key: 'name', label: 'Name', visible: true },
  { key: 'location', label: 'Location', visible: true },
  { key: 'landSize', label: 'Size', visible: true },
  { key: 'status', label: 'Status', visible: true },
  { key: 'source', label: 'Source', visible: true },
  { key: 'expectedAcquisition', label: 'Expected Date', visible: true },
  { key: 'createdAt', label: 'Created', visible: true }
];

/**
 * Presentational component providing column visibility toggles for the opportunity list table.
 * Displays a columns icon button that opens a DaisyUI dropdown with checkboxes.
 * Persists user preferences in localStorage and emits visible column keys on change.
 *
 * Usage:
 * ```html
 * <app-column-toggle (columnsChanged)="onColumnsChanged($event)"></app-column-toggle>
 * ```
 */
@Component({
  selector: 'app-column-toggle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-ghost btn-sm gap-1" aria-label="Toggle column visibility">
        <span class="material-symbols-outlined text-base">view_column</span>
        <span class="hidden sm:inline text-xs">Columns</span>
      </label>
      <ul
        tabindex="0"
        class="dropdown-content menu bg-base-100 rounded-box z-10 w-56 p-3 shadow-lg border border-base-300"
        role="menu"
        aria-label="Column visibility options">
        @for (column of columns; track column.key) {
          <li class="py-1">
            <label class="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-base-200">
              <input
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                [(ngModel)]="column.visible"
                (ngModelChange)="onToggle()"
                [attr.aria-label]="'Show ' + column.label + ' column'" />
              <span class="text-sm">{{ column.label }}</span>
            </label>
          </li>
        }
      </ul>
    </div>
  `
})
export class ColumnToggleComponent implements OnInit {
  @Output() columnsChanged = new EventEmitter<string[]>();

  columns: IColumnConfig[] = [];

  ngOnInit(): void {
    this.columns = this.loadPreferences();
    this.emitVisibleColumns();
  }

  onToggle(): void {
    this.savePreferences();
    this.emitVisibleColumns();
  }

  private emitVisibleColumns(): void {
    const visibleKeys = this.columns
      .filter(col => col.visible)
      .map(col => col.key);
    this.columnsChanged.emit(visibleKeys);
  }

  private loadPreferences(): IColumnConfig[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: Record<string, boolean> = JSON.parse(stored);
        return DEFAULT_COLUMNS.map(col => ({
          ...col,
          visible: parsed[col.key] ?? col.visible
        }));
      }
    } catch {
      // If localStorage is corrupted, fall back to defaults
    }
    return DEFAULT_COLUMNS.map(col => ({ ...col }));
  }

  private savePreferences(): void {
    try {
      const prefs: Record<string, boolean> = {};
      for (const col of this.columns) {
        prefs[col.key] = col.visible;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // localStorage may be unavailable in some environments
    }
  }
}
