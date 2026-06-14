import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Column definition for the data grid.
 */
export interface IGridColumn {
  /** Property key on the data object */
  readonly key: string;
  /** Display label for the column header */
  readonly label: string;
  /** Whether the column supports sorting */
  readonly sortable?: boolean;
  /** Display type for cell rendering */
  readonly type?: 'text' | 'badge' | 'currency' | 'date' | 'progress' | 'number';
  /** Maps values to DaisyUI badge classes (e.g., 'Approved' -> 'badge-success') */
  readonly badgeMap?: Record<string, string>;
  /** Optional fixed width */
  readonly width?: string;
}

/**
 * Filter option for the status dropdown.
 */
export interface IFilterOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Sort event payload emitted when a column header is clicked.
 */
export interface ISortEvent {
  readonly column: string;
  readonly direction: 'asc' | 'desc';
}

/**
 * Reusable data grid component for all listing pages in BuildEstate Pro.
 *
 * Features:
 * - Configurable columns with multiple display types (text, badge, currency, date, progress)
 * - Client-side search across visible text columns
 * - Column sorting with visual indicators
 * - Status filter dropdown
 * - Pagination with page size selector
 * - Empty state with customisable icon and message
 * - Loading skeleton state
 * - Row click handler
 * - Action buttons column (view, edit, delete)
 * - Responsive horizontal scroll on mobile
 * - Animated row entrance with stagger delay
 */
@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      animation: fade-in 0.3s ease-out;
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .row-animate {
      opacity: 0;
      animation: fadeInUp 0.3s ease-out forwards;
    }
    .sort-icon {
      transition: transform 0.2s ease;
    }
    .sort-icon.desc {
      transform: rotate(180deg);
    }
  `],
  template: `
    <div class="card bg-base-100 shadow-sm border border-base-200/80 overflow-hidden">
      <!-- Toolbar -->
      <div class="px-4 py-3 border-b border-base-200/80 bg-base-100 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-base-content" *ngIf="title">{{ title }}</h2>
        <div class="flex items-center gap-3 flex-1 justify-end flex-wrap">
          <!-- Search input -->
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">search</span>
            <input
              type="text"
              [placeholder]="searchPlaceholder"
              class="input input-bordered input-sm pl-9 w-64"
              [ngModel]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              aria-label="Search records" />
          </div>

          <!-- Filter dropdown -->
          <select
            *ngIf="filterOptions.length"
            class="select select-bordered select-sm"
            [ngModel]="selectedFilter"
            (ngModelChange)="onFilterChange($event)"
            [attr.aria-label]="filterLabel + ' filter'">
            <option value="">All {{ filterLabel }}</option>
            <option *ngFor="let opt of filterOptions" [value]="opt.value">{{ opt.label }}</option>
          </select>

          <!-- Page size selector -->
          <select
            class="select select-bordered select-sm"
            [ngModel]="pageSize"
            (ngModelChange)="onPageSizeChange($event)"
            aria-label="Page size">
            <option [ngValue]="10">10 per page</option>
            <option [ngValue]="25">25 per page</option>
            <option [ngValue]="50">50 per page</option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="table table-sm" role="grid">
          <thead>
            <tr class="bg-base-200/50">
              <th
                *ngFor="let col of columns"
                class="text-xs font-semibold uppercase tracking-wider text-base-content/60"
                [style.width]="col.width || 'auto'"
                [class.cursor-pointer]="col.sortable"
                [class.select-none]="col.sortable"
                (click)="col.sortable ? onSort(col.key) : null"
                [attr.aria-sort]="getSortAria(col.key)">
                <div class="flex items-center gap-1">
                  {{ col.label }}
                  <span
                    *ngIf="col.sortable"
                    class="material-symbols-outlined text-sm sort-icon"
                    [class.text-primary]="sortColumn === col.key"
                    [class.desc]="sortColumn === col.key && sortDirection === 'desc'"
                    [class.text-base-content/30]="sortColumn !== col.key">
                    arrow_upward
                  </span>
                </div>
              </th>
              <th *ngIf="showActions" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading skeleton -->
            <ng-container *ngIf="loading">
              <tr *ngFor="let row of skeletonRows" class="animate-pulse">
                <td *ngFor="let col of columns">
                  <div class="h-4 bg-base-300 rounded w-3/4"></div>
                </td>
                <td *ngIf="showActions">
                  <div class="h-4 bg-base-300 rounded w-16"></div>
                </td>
              </tr>
            </ng-container>

            <!-- Empty state -->
            <tr *ngIf="!loading && filteredData.length === 0">
              <td [attr.colspan]="columns.length + (showActions ? 1 : 0)">
                <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                  <span class="material-symbols-outlined text-5xl mb-3">{{ emptyIcon }}</span>
                  <p class="text-base font-medium">{{ emptyMessage }}</p>
                  <p class="text-sm mt-1">{{ emptySubtext }}</p>
                </div>
              </td>
            </tr>

            <!-- Data rows -->
            <ng-container *ngIf="!loading && filteredData.length > 0">
              <tr
                *ngFor="let row of paginatedData; let i = index; trackBy: trackByIndex"
                class="row-animate hover:bg-base-200/30 transition-colors cursor-pointer"
                [style.animation-delay.ms]="i * 40"
                (click)="onRowClick(row)">
                <td *ngFor="let col of columns">
                  <ng-container [ngSwitch]="col.type">
                    <!-- Badge type -->
                    <span
                      *ngSwitchCase="'badge'"
                      class="badge badge-sm"
                      [ngClass]="getBadgeClass(row[col.key], col)">
                      {{ formatBadgeLabel(row[col.key]) }}
                    </span>

                    <!-- Currency type -->
                    <span *ngSwitchCase="'currency'" class="font-mono text-sm">
                      {{ row[col.key] | currency:'GBP':'symbol':'1.0-0' }}
                    </span>

                    <!-- Date type -->
                    <span *ngSwitchCase="'date'" class="text-sm text-base-content/70">
                      {{ row[col.key] | date:'dd MMM yyyy' }}
                    </span>

                    <!-- Number type -->
                    <span *ngSwitchCase="'number'" class="font-mono text-sm">
                      {{ row[col.key] | number:'1.0-2' }}
                    </span>

                    <!-- Progress type -->
                    <ng-container *ngSwitchCase="'progress'">
                      <div class="flex items-center gap-2">
                        <progress
                          class="progress progress-primary w-16 h-2"
                          [value]="row[col.key]"
                          max="100">
                        </progress>
                        <span class="text-xs text-base-content/60">{{ row[col.key] }}%</span>
                      </div>
                    </ng-container>

                    <!-- Default text type -->
                    <span *ngSwitchDefault class="text-sm">
                      {{ row[col.key] ?? '—' }}
                    </span>
                  </ng-container>
                </td>

                <!-- Action buttons -->
                <td *ngIf="showActions" (click)="$event.stopPropagation()">
                  <div class="flex items-center gap-1">
                    <button
                      class="btn btn-ghost btn-xs btn-square"
                      aria-label="View record"
                      (click)="onRowClick(row)">
                      <span class="material-symbols-outlined text-sm">visibility</span>
                    </button>
                    <button
                      class="btn btn-ghost btn-xs btn-square"
                      aria-label="Edit record"
                      (click)="onEditClick(row)">
                      <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      class="btn btn-ghost btn-xs btn-square text-error"
                      aria-label="Delete record"
                      (click)="onDeleteClick(row)">
                      <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div class="flex flex-wrap items-center justify-between px-4 py-3 border-t border-base-200/80 bg-base-100/50 gap-2" *ngIf="!loading && filteredData.length > 0">
        <span class="text-sm text-base-content/60">
          Showing {{ startRecord }}–{{ endRecord }} of {{ filteredData.length }} records
        </span>
        <div class="join">
          <button
            class="join-item btn btn-sm"
            [disabled]="currentPage === 1"
            (click)="goToPage(currentPage - 1)"
            aria-label="Previous page">
            <span class="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <ng-container *ngFor="let page of visiblePages">
            <button
              class="join-item btn btn-sm"
              [class.btn-active]="page === currentPage"
              (click)="goToPage(page)">
              {{ page }}
            </button>
          </ng-container>
          <button
            class="join-item btn btn-sm"
            [disabled]="currentPage === totalPages"
            (click)="goToPage(currentPage + 1)"
            aria-label="Next page">
            <span class="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class DataGridComponent implements OnChanges {
  // ── Inputs ──────────────────────────────────────────────────────────────────
  @Input() data: Record<string, unknown>[] = [];
  @Input() columns: IGridColumn[] = [];
  @Input() loading = false;
  @Input() totalCount = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() searchPlaceholder = 'Search...';
  @Input() filterOptions: IFilterOption[] = [];
  @Input() filterLabel = 'Status';
  @Input() emptyIcon = 'search_off';
  @Input() emptyMessage = 'No records found';
  @Input() emptySubtext = 'Try adjusting your search or filters';
  @Input() showActions = true;
  @Input() title = '';

  // ── Outputs ─────────────────────────────────────────────────────────────────
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();
  @Output() editClick = new EventEmitter<Record<string, unknown>>();
  @Output() deleteClick = new EventEmitter<Record<string, unknown>>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<ISortEvent>();
  @Output() pageSizeChange = new EventEmitter<number>();

  // ── Internal state ──────────────────────────────────────────────────────────
  searchTerm = '';
  selectedFilter = '';
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  filteredData: Record<string, unknown>[] = [];

  /** Skeleton row count for loading state */
  readonly skeletonRows = Array.from({ length: 5 });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['columns']) {
      this.applyFilters();
    }
  }

  // ── Computed properties ─────────────────────────────────────────────────────
  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredData.length / this.pageSize));
  }

  get startRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredData.length);
  }

  get paginatedData(): Record<string, unknown>[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredData.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(this.totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  // ── Event handlers ──────────────────────────────────────────────────────────
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyFilters();
    this.searchChange.emit(term);
  }

  onFilterChange(value: string): void {
    this.selectedFilter = value;
    this.currentPage = 1;
    this.applyFilters();
    this.filterChange.emit(value);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = +size;
    this.currentPage = 1;
    this.pageSizeChange.emit(this.pageSize);
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }

  onEditClick(row: Record<string, unknown>): void {
    this.editClick.emit(row);
  }

  onDeleteClick(row: Record<string, unknown>): void {
    this.deleteClick.emit(row);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.pageChange.emit(page);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  trackByIndex(index: number): number {
    return index;
  }

  getBadgeClass(value: unknown, col: IGridColumn): string {
    if (!col.badgeMap || !value) return 'badge-ghost';
    return col.badgeMap[value as string] ?? 'badge-ghost';
  }

  formatBadgeLabel(value: unknown): string {
    if (!value) return '—';
    return String(value)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  getSortAria(column: string): string | null {
    if (this.sortColumn !== column) return null;
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  // ── Private ─────────────────────────────────────────────────────────────────
  private applyFilters(): void {
    let result = [...this.data];

    // Apply search filter across text columns
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      const textColumns = this.columns
        .filter(c => !c.type || c.type === 'text' || c.type === 'badge')
        .map(c => c.key);

      result = result.filter(row =>
        textColumns.some(key => {
          const val = row[key];
          return val != null && String(val).toLowerCase().includes(term);
        })
      );
    }

    // Apply status/filter dropdown
    if (this.selectedFilter) {
      // Find the first badge column to filter on, or use 'status' key
      const filterKey = this.columns.find(c => c.type === 'badge')?.key ?? 'status';
      result = result.filter(row => row[filterKey] === this.selectedFilter);
    }

    // Apply sorting
    if (this.sortColumn) {
      result.sort((a, b) => {
        const aVal = a[this.sortColumn];
        const bVal = b[this.sortColumn];

        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    this.filteredData = result;

    // Reset to first page if current page exceeds total
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }
}
