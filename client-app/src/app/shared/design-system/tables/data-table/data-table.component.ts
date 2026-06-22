import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// ─── Interfaces ────────────────────────────────────────────────────────────────

/** Column definition for the data table */
export interface IColumnDefinition {
  key: string;
  label: string;
  type: 'text' | 'badge' | 'currency' | 'date' | 'number' | 'progress' | 'custom';
  sortable: boolean;
  visible: boolean;
  width?: string;
  badgeMap?: Record<string, IBadgeMapEntry>;
  templateRef?: unknown;
}

/** Badge map entry for badge-type columns */
export interface IBadgeMapEntry {
  label: string;
  cssClass: string;
  icon?: string;
}

/** Row action definition */
export interface ITableAction {
  label: string;
  icon: string;
  event: string;
  condition?: (row: unknown) => boolean;
}

/** Saved view configuration */
export interface ISavedView {
  id: string;
  name: string;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc' | null;
  filters: Record<string, unknown>;
}

/** Page change event payload */
export interface IPageChangeEvent {
  page: number;
  pageSize: number;
}

/** Sort change event payload */
export interface ISortChangeEvent {
  column: string;
  direction: 'asc' | 'desc';
}

/** Action click event payload */
export interface IActionClickEvent {
  action: string;
  row: unknown;
}

/** Bulk action event payload */
export interface IBulkActionEvent {
  action: string;
  selectedIds: string[];
}

/** Export request event payload */
export interface IExportRequestEvent {
  format: 'csv' | 'excel';
  filters: Record<string, unknown>;
}

/** Maximum rows per export */
const MAX_EXPORT_ROWS = 10000;

/** Maximum saved views per user */
const MAX_SAVED_VIEWS = 20;

/** Search debounce time in ms */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Enterprise Data Table Component (`app-data-table`)
 *
 * Server-side table that emits events (pageChange, sortChange, searchChange)
 * and receives data from the parent. It does NOT fetch data itself.
 *
 * Features:
 * - Server-side pagination with configurable page sizes (10, 25, 50, 100)
 * - Column sorting with ascending/descending toggle
 * - Debounced text search (300ms)
 * - Column visibility picker (minimum 1 column visible)
 * - Row actions dropdown menu
 * - Bulk select with select-all checkbox per page
 * - CSV/Excel export (max 10,000 rows)
 * - Saved views (column order, visibility, sort, filters) — max 20 per user
 * - Loading skeleton, empty, and error states with retry
 * - Horizontal scroll for viewports < 768px
 * - Native <table>, <thead>, <th scope="col">, <td> for accessibility
 *
 * @requirements 3.1–3.13, 17.2, 18.7
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Toolbar: Search, Column visibility, Export, Saved Views -->
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- Search -->
      <div class="flex-1 min-w-48">
        <label class="input input-bordered input-sm flex items-center gap-2 w-full max-w-xs">
          <span class="material-symbols-outlined text-base opacity-60" aria-hidden="true">search</span>
          <input
            type="text"
            class="grow"
            [placeholder]="searchPlaceholder"
            [value]="searchTerm()"
            (input)="onSearchInput($event)"
            aria-label="Search table"
          />
        </label>
      </div>

      <!-- Column Visibility Picker -->
      @if (enableColumnVisibility) {
        <div class="dropdown dropdown-end">
          <button
            tabindex="0"
            type="button"
            class="btn btn-ghost btn-sm gap-1"
            aria-haspopup="true"
            aria-label="Toggle column visibility"
          >
            <span class="material-symbols-outlined text-base" aria-hidden="true">view_column</span>
            Columns
          </button>
          <ul tabindex="0" class="dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-52 max-h-64 overflow-y-auto">
            @for (col of columns; track col.key) {
              <li>
                <label class="label cursor-pointer justify-start gap-2 py-1">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-xs"
                    [checked]="columnVisibility()[col.key]"
                    [disabled]="isLastVisibleColumn(col.key)"
                    (change)="toggleColumnVisibility(col.key)"
                  />
                  <span class="label-text text-sm">{{ col.label }}</span>
                </label>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Export -->
      @if (enableExport && exportFormats.length > 0) {
        <div class="dropdown dropdown-end">
          <button
            tabindex="0"
            type="button"
            class="btn btn-ghost btn-sm gap-1"
            aria-haspopup="true"
            aria-label="Export data"
          >
            <span class="material-symbols-outlined text-base" aria-hidden="true">download</span>
            Export
          </button>
          <ul tabindex="0" class="dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-40">
            @for (format of exportFormats; track format) {
              <li>
                <button type="button" (click)="onExport(format)">
                  {{ format === 'csv' ? 'CSV' : 'Excel' }}
                </button>
              </li>
            }
          </ul>
        </div>
      }

      <!-- Saved Views -->
      @if (enableSavedViews) {
        <div class="dropdown dropdown-end">
          <button
            tabindex="0"
            type="button"
            class="btn btn-ghost btn-sm gap-1"
            aria-haspopup="true"
            aria-label="Saved views"
          >
            <span class="material-symbols-outlined text-base" aria-hidden="true">bookmark</span>
            Views
          </button>
          <ul tabindex="0" class="dropdown-content z-20 menu p-2 shadow-lg bg-base-100 rounded-box w-52 max-h-64 overflow-y-auto">
            @for (view of savedViews; track view.id) {
              <li>
                <button type="button" (click)="onLoadView(view)">{{ view.name }}</button>
              </li>
            }
            @if (savedViews.length === 0) {
              <li class="disabled"><span class="text-xs opacity-60">No saved views</span></li>
            }
          </ul>
        </div>
      }
    </div>

    <!-- Loading State -->
    @if (loading && (!data || data.length === 0)) {
      <div class="w-full overflow-x-auto" aria-busy="true" aria-label="Loading table data" role="status">
        <table class="table w-full">
          <thead>
            <tr>
              @for (col of visibleColumns(); track col.key) {
                <th scope="col">
                  <div class="skeleton-shimmer h-4 w-20 rounded"></div>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of skeletonRows; track $index) {
              <tr>
                @for (col of visibleColumns(); track col.key) {
                  <td>
                    <div class="skeleton-shimmer h-4 rounded" [style.width]="skeletonCellWidth($index)"></div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- Error State -->
    @else if (error) {
      <div class="flex flex-col items-center justify-center py-12 text-center" role="alert">
        <span class="material-symbols-outlined text-error text-5xl mb-4" aria-hidden="true">error_outline</span>
        <p class="text-base-content font-medium mb-2">Failed to load data</p>
        <p class="text-sm text-base-content/60 mb-4 max-w-md">{{ error }}</p>
        <button type="button" class="btn btn-primary btn-sm" (click)="onRetry()">
          <span class="material-symbols-outlined text-base mr-1" aria-hidden="true">refresh</span>
          Retry
        </button>
      </div>
    }

    <!-- Empty State -->
    @else if (!loading && data.length === 0) {
      <div class="flex flex-col items-center justify-center py-12 text-center">
        <span
          class="material-symbols-outlined text-base-content/40 mb-4"
          style="font-size: 48px;"
          aria-hidden="true"
        >{{ emptyIcon }}</span>
        <p class="text-base-content font-medium">{{ emptyMessage }}</p>
        <p class="text-sm text-base-content/60 mt-1">{{ emptySubtext }}</p>
      </div>
    }

    <!-- Data Table -->
    @else {
      <div class="w-full overflow-x-auto" [class.max-md:overflow-x-scroll]="true">
        <table class="table w-full" [attr.aria-busy]="loading">
          <thead>
            <tr>
              <!-- Bulk select checkbox -->
              @if (enableBulkSelect) {
                <th scope="col" class="w-10">
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    [checked]="allPageSelected()"
                    [indeterminate]="somePageSelected()"
                    (change)="toggleSelectAll()"
                    aria-label="Select all rows on this page"
                  />
                </th>
              }

              <!-- Column headers -->
              @for (col of visibleColumns(); track col.key) {
                <th
                  scope="col"
                  [style.width]="col.width || 'auto'"
                  [class.cursor-pointer]="col.sortable"
                  [class.select-none]="col.sortable"
                  (click)="col.sortable ? onSortColumn(col.key) : null"
                  [attr.aria-sort]="getAriaSortValue(col.key)"
                >
                  <div class="flex items-center gap-1">
                    <span>{{ col.label }}</span>
                    @if (col.sortable) {
                      <span class="material-symbols-outlined text-sm opacity-60" aria-hidden="true">
                        {{ getSortIcon(col.key) }}
                      </span>
                    }
                  </div>
                </th>
              }

              <!-- Actions column header -->
              @if (actions.length > 0) {
                <th scope="col" class="w-10">
                  <span class="sr-only">Actions</span>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of data; track $index) {
              <tr
                class="hover:bg-base-200/50 transition-colors"
                [class.bg-base-200/30]="isRowSelected($index)"
                (click)="onRowClick(row)"
              >
                <!-- Bulk select checkbox -->
                @if (enableBulkSelect) {
                  <td (click)="$event.stopPropagation()">
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      [checked]="isRowSelected($index)"
                      (change)="toggleRowSelection($index)"
                      [attr.aria-label]="'Select row ' + ($index + 1)"
                    />
                  </td>
                }

                <!-- Data cells -->
                @for (col of visibleColumns(); track col.key) {
                  <td>{{ getCellValue(row, col) }}</td>
                }

                <!-- Actions dropdown -->
                @if (actions.length > 0) {
                  <td (click)="$event.stopPropagation()">
                    <div class="dropdown dropdown-end">
                      <button
                        tabindex="0"
                        type="button"
                        class="btn btn-ghost btn-xs btn-circle"
                        aria-haspopup="true"
                        aria-label="Row actions"
                      >
                        <span class="material-symbols-outlined text-base" aria-hidden="true">more_vert</span>
                      </button>
                      <ul tabindex="0" class="dropdown-content z-20 menu p-1 shadow-lg bg-base-100 rounded-box w-44">
                        @for (action of getVisibleActions(row); track action.event) {
                          <li>
                            <button type="button" (click)="onActionClick(action.event, row)">
                              <span class="material-symbols-outlined text-sm" aria-hidden="true">{{ action.icon }}</span>
                              {{ action.label }}
                            </button>
                          </li>
                        }
                      </ul>
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
        <!-- Page size selector -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-base-content/70">Rows per page:</span>
          <select
            class="select select-bordered select-xs w-20"
            [ngModel]="currentPageSize()"
            (ngModelChange)="onPageSizeChange($event)"
            aria-label="Rows per page"
          >
            @for (size of pageSizeOptions; track size) {
              <option [ngValue]="size">{{ size }}</option>
            }
          </select>
        </div>

        <!-- Page info and navigation -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-base-content/70">
            {{ paginationLabel() }}
          </span>
          <div class="join">
            <button
              type="button"
              class="join-item btn btn-xs"
              [disabled]="currentPage() <= 1"
              (click)="onPageChange(currentPage() - 1)"
              aria-label="Previous page"
            >
              <span class="material-symbols-outlined text-base" aria-hidden="true">chevron_left</span>
            </button>
            <button
              type="button"
              class="join-item btn btn-xs"
              [disabled]="currentPage() >= totalPages()"
              (click)="onPageChange(currentPage() + 1)"
              aria-label="Next page"
            >
              <span class="material-symbols-outlined text-base" aria-hidden="true">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        oklch(var(--b3)) 25%,
        oklch(var(--b2)) 50%,
        oklch(var(--b3)) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 767px) {
      :host .overflow-x-auto {
        overflow-x: scroll;
        -webkit-overflow-scrolling: touch;
      }
    }
  `]
})
export class DataTableComponent implements OnInit, OnDestroy {
  // ─── Inputs ──────────────────────────────────────────────────────────────────

  /** Column definitions */
  @Input() columns: IColumnDefinition[] = [];

  /** Data rows to display */
  @Input() data: unknown[] = [];

  /** Total record count for pagination */
  @Input() totalCount = 0;

  /** Whether data is currently loading */
  @Input() loading = false;

  /** Error message when data load fails */
  @Input() error: string | null = null;

  /** Configurable page size options */
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  /** Row action definitions */
  @Input() actions: ITableAction[] = [];

  /** Supported export formats */
  @Input() exportFormats: ('csv' | 'excel')[] = [];

  /** Icon for empty state */
  @Input() emptyIcon = 'search_off';

  /** Primary message for empty state */
  @Input() emptyMessage = 'No data found';

  /** Secondary guidance for empty state */
  @Input() emptySubtext = 'Try adjusting your search or filters.';

  /** Enable/disable bulk select */
  @Input() enableBulkSelect = false;

  /** Enable/disable column visibility picker */
  @Input() enableColumnVisibility = true;

  /** Enable/disable export */
  @Input() enableExport = false;

  /** Enable/disable saved views */
  @Input() enableSavedViews = false;

  /** Search placeholder text */
  @Input() searchPlaceholder = 'Search...';

  /** Column keys to search across */
  @Input() searchColumns: string[] = [];

  /** Saved views */
  @Input() savedViews: ISavedView[] = [];

  // ─── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted when page or page size changes */
  @Output() pageChange = new EventEmitter<IPageChangeEvent>();

  /** Emitted when sort column or direction changes */
  @Output() sortChange = new EventEmitter<ISortChangeEvent>();

  /** Emitted after debounced search input */
  @Output() searchChange = new EventEmitter<string>();

  /** Emitted when filters change */
  @Output() filterChange = new EventEmitter<Record<string, unknown>>();

  /** Emitted when a row is clicked */
  @Output() rowClick = new EventEmitter<unknown>();

  /** Emitted when a row action is clicked */
  @Output() actionClick = new EventEmitter<IActionClickEvent>();

  /** Emitted for bulk actions */
  @Output() bulkAction = new EventEmitter<IBulkActionEvent>();

  /** Emitted when export is requested */
  @Output() exportRequest = new EventEmitter<IExportRequestEvent>();

  /** Emitted when retry button is clicked */
  @Output() retryClick = new EventEmitter<void>();

  // ─── Internal State (Signals) ────────────────────────────────────────────────

  /** Current search term */
  readonly searchTerm = signal('');

  /** Current page number (1-indexed) */
  readonly currentPage = signal(1);

  /** Current page size */
  readonly currentPageSize = signal(10);

  /** Current sort column key */
  readonly currentSortColumn = signal<string | null>(null);

  /** Current sort direction */
  readonly currentSortDirection = signal<'asc' | 'desc'>('asc');

  /** Column visibility map */
  readonly columnVisibility = signal<Record<string, boolean>>({});

  /** Selected row indices on current page */
  readonly selectedRows = signal<Set<number>>(new Set());

  // ─── Computed Values ─────────────────────────────────────────────────────────

  /** Total number of pages */
  readonly totalPages = computed(() => {
    const ps = this.currentPageSize();
    return ps > 0 ? Math.max(1, Math.ceil(this.totalCount / ps)) : 1;
  });

  /** Visible columns based on visibility map */
  readonly visibleColumns = computed(() => {
    const vis = this.columnVisibility();
    return this.columns.filter(col => vis[col.key] !== false);
  });

  /** Whether all rows on current page are selected */
  readonly allPageSelected = computed(() => {
    if (this.data.length === 0) return false;
    return this.selectedRows().size === this.data.length;
  });

  /** Whether some (but not all) rows on current page are selected */
  readonly somePageSelected = computed(() => {
    const size = this.selectedRows().size;
    return size > 0 && size < this.data.length;
  });

  /** Pagination label text */
  readonly paginationLabel = computed(() => {
    const page = this.currentPage();
    const ps = this.currentPageSize();
    const total = this.totalCount;
    const start = Math.min((page - 1) * ps + 1, total);
    const end = Math.min(page * ps, total);
    return `${start}–${end} of ${total}`;
  });

  // ─── Private ─────────────────────────────────────────────────────────────────

  /** Subject for debounced search */
  private readonly searchSubject$ = new Subject<string>();
  private searchSubscription: Subscription | null = null;

  /** Skeleton rows for loading state */
  readonly skeletonRows = Array.from({ length: 5 });

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Initialize column visibility from column definitions
    const vis: Record<string, boolean> = {};
    this.columns.forEach(col => {
      vis[col.key] = col.visible !== false;
    });
    this.columnVisibility.set(vis);

    // Initialize page size from first option
    if (this.pageSizeOptions.length > 0) {
      this.currentPageSize.set(this.pageSizeOptions[0]);
    }

    // Set up debounced search
    this.searchSubscription = this.searchSubject$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        distinctUntilChanged()
      )
      .subscribe(term => {
        this.searchChange.emit(term);
      });
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.searchSubject$.complete();
  }

  // ─── Search ──────────────────────────────────────────────────────────────────

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.searchSubject$.next(value);
  }

  // ─── Sorting ─────────────────────────────────────────────────────────────────

  onSortColumn(columnKey: string): void {
    const currentCol = this.currentSortColumn();
    let direction: 'asc' | 'desc';

    if (currentCol === columnKey) {
      // Toggle direction
      direction = this.currentSortDirection() === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, reset to asc
      direction = 'asc';
    }

    this.currentSortColumn.set(columnKey);
    this.currentSortDirection.set(direction);
    this.sortChange.emit({ column: columnKey, direction });
  }

  getSortIcon(columnKey: string): string {
    if (this.currentSortColumn() !== columnKey) {
      return 'unfold_more';
    }
    return this.currentSortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  getAriaSortValue(columnKey: string): string | null {
    if (this.currentSortColumn() !== columnKey) return null;
    return this.currentSortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  // ─── Pagination ──────────────────────────────────────────────────────────────

  onPageChange(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(clamped);
    this.selectedRows.set(new Set());
    this.pageChange.emit({ page: clamped, pageSize: this.currentPageSize() });
  }

  onPageSizeChange(size: number): void {
    this.currentPageSize.set(size);
    this.currentPage.set(1);
    this.selectedRows.set(new Set());
    this.pageChange.emit({ page: 1, pageSize: size });
  }

  // ─── Column Visibility ───────────────────────────────────────────────────────

  toggleColumnVisibility(key: string): void {
    const vis = { ...this.columnVisibility() };
    vis[key] = !vis[key];

    // Ensure at least one column remains visible
    const visibleCount = Object.values(vis).filter(v => v).length;
    if (visibleCount < 1) return;

    this.columnVisibility.set(vis);
  }

  isLastVisibleColumn(key: string): boolean {
    const vis = this.columnVisibility();
    if (!vis[key]) return false;
    const visibleCount = Object.values(vis).filter(v => v).length;
    return visibleCount <= 1;
  }

  // ─── Bulk Selection ──────────────────────────────────────────────────────────

  toggleSelectAll(): void {
    if (this.allPageSelected()) {
      this.selectedRows.set(new Set());
    } else {
      const all = new Set<number>();
      this.data.forEach((_, i) => all.add(i));
      this.selectedRows.set(all);
    }
  }

  toggleRowSelection(index: number): void {
    const current = new Set(this.selectedRows());
    if (current.has(index)) {
      current.delete(index);
    } else {
      current.add(index);
    }
    this.selectedRows.set(current);
  }

  isRowSelected(index: number): boolean {
    return this.selectedRows().has(index);
  }

  /** Get the IDs of selected rows for bulk action emission */
  getSelectedIds(): string[] {
    return Array.from(this.selectedRows()).map(i => {
      const row = this.data[i] as Record<string, unknown>;
      return String(row['id'] || row['Id'] || i);
    });
  }

  // ─── Row Actions ─────────────────────────────────────────────────────────────

  onRowClick(row: unknown): void {
    this.rowClick.emit(row);
  }

  onActionClick(event: string, row: unknown): void {
    this.actionClick.emit({ action: event, row });
  }

  getVisibleActions(row: unknown): ITableAction[] {
    return this.actions.filter(a => !a.condition || a.condition(row));
  }

  // ─── Export ──────────────────────────────────────────────────────────────────

  onExport(format: 'csv' | 'excel'): void {
    if (this.totalCount > MAX_EXPORT_ROWS) {
      // Emit with capped row count warning — parent handles the actual export
      console.warn(
        `Export capped at ${MAX_EXPORT_ROWS} rows. Total: ${this.totalCount}`
      );
    }
    this.exportRequest.emit({ format, filters: {} });
  }

  // ─── Saved Views ─────────────────────────────────────────────────────────────

  onLoadView(view: ISavedView): void {
    // Apply column visibility
    const vis: Record<string, boolean> = {};
    this.columns.forEach(col => {
      vis[col.key] = view.columnVisibility[col.key] !== false;
    });
    this.columnVisibility.set(vis);

    // Apply sort
    if (view.sortColumn) {
      this.currentSortColumn.set(view.sortColumn);
      this.currentSortDirection.set(view.sortDirection || 'asc');
      this.sortChange.emit({
        column: view.sortColumn,
        direction: view.sortDirection || 'asc',
      });
    }

    // Apply filters
    if (view.filters && Object.keys(view.filters).length > 0) {
      this.filterChange.emit(view.filters);
    }
  }

  /** Check if we can still save more views */
  canSaveView(): boolean {
    return this.savedViews.length < MAX_SAVED_VIEWS;
  }

  // ─── Error/Retry ─────────────────────────────────────────────────────────────

  onRetry(): void {
    this.retryClick.emit();
  }

  // ─── Cell Rendering ──────────────────────────────────────────────────────────

  getCellValue(row: unknown, col: IColumnDefinition): string {
    const record = row as Record<string, unknown>;
    const value = record[col.key];

    if (value == null) return '';

    switch (col.type) {
      case 'currency':
        return typeof value === 'number'
          ? `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : String(value);
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('en-GB');
        }
        if (typeof value === 'string') {
          const d = new Date(value);
          return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('en-GB');
        }
        return String(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('en-GB') : String(value);
      case 'progress':
        return typeof value === 'number' ? `${value}%` : String(value);
      case 'badge':
        if (col.badgeMap && typeof value === 'string' && col.badgeMap[value]) {
          return col.badgeMap[value].label;
        }
        return String(value);
      default:
        return String(value);
    }
  }

  // ─── Skeleton Helpers ────────────────────────────────────────────────────────

  skeletonCellWidth(index: number): string {
    const widths = ['60%', '80%', '45%', '70%', '55%', '90%', '50%', '75%'];
    return widths[index % widths.length];
  }
}
