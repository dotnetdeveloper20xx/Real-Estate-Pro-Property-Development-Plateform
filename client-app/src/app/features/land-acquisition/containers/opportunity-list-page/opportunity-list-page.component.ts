import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { IOpportunityListItem, OpportunityStatus } from '../../models/opportunity.model';
import { IOpportunityQueryParams } from '../../services/opportunity.service';
import { CsvExportService } from '../../services/csv-export.service';
import { ConfirmDialogService } from '../../../../shared/design-system/services/confirm-dialog.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ColumnToggleComponent } from '../../components/column-toggle/column-toggle.component';
import { SavedViewsComponent } from '../../components/saved-views/saved-views.component';
import {
  OpportunityActions,
  selectAllOpportunities,
  selectOpportunityLoading,
  selectPagination,
  selectBulkDeleteInProgress,
  selectFilters,
  IOpportunityFilters,
  IPaginationMeta
} from '../../store/opportunity';

interface IOpportunityMetrics {
  total: number;
  active: number;
  inDueDiligence: number;
  acquired: number;
  withdrawn: number;
}

@Component({
  selector: 'app-opportunity-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ColumnToggleComponent, SavedViewsComponent],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-base-content">Opportunities</h1>
          <p class="text-sm text-base-content/60 mt-1">
            Manage and track all land acquisition opportunities in your pipeline.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn btn-outline btn-sm gap-2" (click)="exportOpportunities()">
            <span class="material-symbols-outlined text-lg">download</span>
            Export
          </button>
          <button class="btn btn-primary gap-2" (click)="navigateToCreate()">
            <span class="material-symbols-outlined text-lg">add</span>
            New Opportunity
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Total Opportunities</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.total }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-primary">landscape</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-base-content/50">Across all stages</div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Active Pipeline</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.active }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-success">trending_up</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-success flex items-center gap-1">
              {{ getActivePercentage() }}% of total
            </div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">In Due Diligence</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.inDueDiligence }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-warning">fact_check</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-base-content/50">Under investigation</div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Acquired</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.acquired }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-info">check_circle</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-base-content/50">Successfully completed</div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-200 shadow-sm">
          <div class="card-body p-4">
            <div class="flex items-start justify-between">
              <div>
                <span class="text-xs font-medium text-base-content/60">Withdrawn</span>
                <p class="text-2xl font-bold text-base-content mt-1">{{ metrics.withdrawn }}</p>
              </div>
              <div class="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-error">cancel</span>
              </div>
            </div>
            <div class="mt-2 text-xs text-base-content/50">Rejected or cancelled</div>
          </div>
        </div>
      </div>

      <!-- Main Content: Filters + Table -->
      <div class="flex gap-6">
        <!-- Left Filters Panel -->
        <div class="w-64 shrink-0 hidden lg:block">
          <div class="card bg-base-100 border border-base-200 shadow-sm sticky top-6">
            <div class="card-body p-4 space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-base-content flex items-center gap-2">
                  <span class="material-symbols-outlined text-base text-primary">filter_list</span>
                  Filters
                  <span *ngIf="activeFilterCount > 0" class="badge badge-primary badge-xs">{{ activeFilterCount }}</span>
                </h3>
                <button class="text-xs text-primary hover:underline" (click)="resetFilters()">Reset</button>
              </div>

              <!-- Saved Views -->
              <app-saved-views
                [currentFilters]="currentFilters"
                (viewSelected)="onViewSelected($event)">
              </app-saved-views>

              <!-- Search -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Search</span></label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base-content/40 text-sm">search</span>
                  <input type="text" placeholder="Search opportunities..."
                         class="input input-bordered input-sm pl-8 w-full"
                         [(ngModel)]="localFilters.search"
                         (ngModelChange)="onSearchInput($event)" />
                </div>
              </div>

              <!-- Status -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Status</span></label>
                <select class="select select-bordered select-sm w-full"
                        [(ngModel)]="localFilters.status" (ngModelChange)="onFilterChange()">
                  <option value="">All Status</option>
                  <option *ngFor="let s of statusOptions" [value]="s.value">{{ s.label }}</option>
                </select>
              </div>

              <!-- Location -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Location</span></label>
                <input type="text" placeholder="Filter by location..."
                       class="input input-bordered input-sm w-full"
                       [(ngModel)]="localFilters.location"
                       (ngModelChange)="onFilterChange()" />
              </div>

              <!-- Source -->
              <div class="form-control">
                <label class="label py-1"><span class="label-text text-xs font-medium">Source</span></label>
                <input type="text" placeholder="Filter by source..."
                       class="input input-bordered input-sm w-full"
                       [(ngModel)]="localFilters.source"
                       (ngModelChange)="onFilterChange()" />
              </div>

              <!-- Apply Filters -->
              <div class="flex gap-2 pt-2">
                <button class="btn btn-ghost btn-sm flex-1" (click)="resetFilters()">Clear All</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Table Section -->
        <div class="flex-1 min-w-0 space-y-4">
          <!-- Toolbar: Column Toggle + Bulk Actions -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3" *ngIf="selectedIds.size > 0">
              <span class="text-sm font-medium text-base-content">
                {{ selectedIds.size }} {{ selectedIds.size === 1 ? 'result' : 'results' }} selected
              </span>
              <button class="text-xs text-primary hover:underline" (click)="selectAll()">Select all {{ pagination.totalCount }}</button>
              <button class="text-xs text-base-content/50 hover:underline" (click)="clearSelection()">Clear selection</button>
              <div class="dropdown dropdown-end">
                <div tabindex="0" role="button" class="btn btn-sm btn-outline gap-1"
                     [class.btn-disabled]="bulkDeleteInProgress">
                  <span *ngIf="bulkDeleteInProgress" class="loading loading-spinner loading-xs"></span>
                  {{ bulkDeleteInProgress ? 'Deleting...' : 'Bulk Actions' }}
                  <span class="material-symbols-outlined text-sm">expand_more</span>
                </div>
                <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-200">
                  <li><a (click)="bulkDelete()"><span class="material-symbols-outlined text-sm text-error">delete</span> Delete Selected</a></li>
                </ul>
              </div>
            </div>
            <div class="flex items-center gap-2 ml-auto">
              <app-column-toggle (columnsChanged)="onColumnsChanged($event)"></app-column-toggle>
            </div>
          </div>

          <!-- Data Table Card -->
          <div class="card bg-base-100 shadow-sm border border-base-200/80 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="table table-sm" role="grid" aria-label="Opportunities table">
                <thead>
                  <tr class="bg-base-200/50">
                    <th class="w-10">
                      <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                             [checked]="isAllSelected" (change)="toggleSelectAll()" />
                    </th>
                    <th *ngIf="isColumnVisible('name')" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('name')">
                      <div class="flex items-center gap-1">Name
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'name'">
                          {{ sortColumn === 'name' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th *ngIf="isColumnVisible('location')" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('location')">
                      <div class="flex items-center gap-1">Location
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'location'">
                          {{ sortColumn === 'location' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th *ngIf="isColumnVisible('landSize')" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('landSize')">
                      <div class="flex items-center gap-1">Size (acres)
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'landSize'">
                          {{ sortColumn === 'landSize' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th *ngIf="isColumnVisible('status')" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('status')">
                      <div class="flex items-center gap-1">Status
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'status'">
                          {{ sortColumn === 'status' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th *ngIf="isColumnVisible('source')" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('source')">
                      <div class="flex items-center gap-1">Source
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'source'">
                          {{ sortColumn === 'source' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th *ngIf="isColumnVisible('expectedAcquisition')" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('expectedAcquisition')">
                      <div class="flex items-center gap-1">Expected Date
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'expectedAcquisition'">
                          {{ sortColumn === 'expectedAcquisition' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th *ngIf="isColumnVisible('createdAt')" class="text-xs font-semibold uppercase tracking-wider text-base-content/60 cursor-pointer select-none"
                        (click)="onSort('createdAt')">
                      <div class="flex items-center gap-1">Created
                        <span class="material-symbols-outlined text-xs" [class.text-primary]="sortColumn === 'createdAt'">
                          {{ sortColumn === 'createdAt' && sortDirection === 'desc' ? 'arrow_downward' : 'arrow_upward' }}
                        </span>
                      </div>
                    </th>
                    <th class="text-xs font-semibold uppercase tracking-wider text-base-content/60 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Loading skeleton -->
                  <ng-container *ngIf="loading">
                    <tr *ngFor="let row of skeletonRows" class="animate-pulse">
                      <td><div class="h-4 w-4 bg-base-300 rounded"></div></td>
                      <td *ngIf="isColumnVisible('name')"><div class="h-4 bg-base-300 rounded w-32"></div></td>
                      <td *ngIf="isColumnVisible('location')"><div class="h-4 bg-base-300 rounded w-28"></div></td>
                      <td *ngIf="isColumnVisible('landSize')"><div class="h-4 bg-base-300 rounded w-16"></div></td>
                      <td *ngIf="isColumnVisible('status')"><div class="h-4 bg-base-300 rounded w-20"></div></td>
                      <td *ngIf="isColumnVisible('source')"><div class="h-4 bg-base-300 rounded w-20"></div></td>
                      <td *ngIf="isColumnVisible('expectedAcquisition')"><div class="h-4 bg-base-300 rounded w-24"></div></td>
                      <td *ngIf="isColumnVisible('createdAt')"><div class="h-4 bg-base-300 rounded w-20"></div></td>
                      <td><div class="h-4 bg-base-300 rounded w-16"></div></td>
                    </tr>
                  </ng-container>

                  <!-- Empty state -->
                  <tr *ngIf="!loading && opportunities.length === 0">
                    <td [attr.colspan]="visibleColumnCount + 2">
                      <div class="flex flex-col items-center justify-center py-12 text-base-content/50">
                        <span class="material-symbols-outlined text-5xl mb-3">terrain</span>
                        <p class="text-base font-medium">No opportunities found</p>
                        <p class="text-sm mt-1">Create your first opportunity to begin evaluating development sites.</p>
                      </div>
                    </td>
                  </tr>

                  <!-- Data rows -->
                  <ng-container *ngIf="!loading && opportunities.length > 0">
                    <tr *ngFor="let opp of opportunities; trackBy: trackById"
                        class="hover:bg-base-200/30 transition-colors">
                      <td (click)="$event.stopPropagation()">
                        <input type="checkbox" class="checkbox checkbox-sm checkbox-primary"
                               [checked]="selectedIds.has(opp.id)" (change)="toggleSelect(opp.id)" />
                      </td>
                      <td *ngIf="isColumnVisible('name')">
                        <div class="flex items-center gap-3 cursor-pointer" (click)="navigateToDetail(opp.id)">
                          <div class="avatar placeholder">
                            <div class="rounded-lg w-9 h-9 flex items-center justify-center text-white text-xs font-bold"
                                 [style.background-color]="getStatusColor(opp.status)">
                              <span class="material-symbols-outlined text-sm">landscape</span>
                            </div>
                          </div>
                          <span class="font-medium text-sm text-base-content">{{ opp.name }}</span>
                        </div>
                      </td>
                      <td *ngIf="isColumnVisible('location')" class="text-sm text-base-content/70">{{ opp.location }}</td>
                      <td *ngIf="isColumnVisible('landSize')" class="text-sm text-base-content/70 font-mono">{{ opp.landSize | number:'1.1-1' }}</td>
                      <td *ngIf="isColumnVisible('status')">
                        <span class="badge badge-sm font-medium" [ngClass]="getStatusBadgeClass(opp.status)">
                          {{ formatStatus(opp.status) }}
                        </span>
                      </td>
                      <td *ngIf="isColumnVisible('source')" class="text-sm text-base-content/70">{{ opp.source ?? '—' }}</td>
                      <td *ngIf="isColumnVisible('expectedAcquisition')" class="text-sm text-base-content/60">{{ opp.expectedAcquisition ? (opp.expectedAcquisition | date:'dd MMM yyyy') : '—' }}</td>
                      <td *ngIf="isColumnVisible('createdAt')" class="text-sm text-base-content/60">{{ opp.createdAt | date:'dd MMM yyyy' }}</td>
                      <td (click)="$event.stopPropagation()">
                        <div class="flex items-center gap-0.5">
                          <button class="btn btn-ghost btn-xs btn-square" aria-label="View"
                                  (click)="navigateToDetail(opp.id)">
                            <span class="material-symbols-outlined text-sm">visibility</span>
                          </button>
                          <button class="btn btn-ghost btn-xs btn-square" aria-label="Edit"
                                  (click)="navigateToEdit(opp.id)">
                            <span class="material-symbols-outlined text-sm">edit</span>
                          </button>
                          <button class="btn btn-ghost btn-xs btn-square text-error" aria-label="Delete"
                                  (click)="onDelete(opp)">
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
            <div class="flex flex-wrap items-center justify-between px-4 py-3 border-t border-base-200/80 bg-base-100/50 gap-2"
                 *ngIf="!loading && opportunities.length > 0">
              <span class="text-sm text-base-content/60">
                Showing {{ startRecord }} to {{ endRecord }} of {{ pagination.totalCount }} opportunities
              </span>
              <div class="flex items-center gap-3">
                <div class="join">
                  <button class="join-item btn btn-sm" [disabled]="pagination.pageNumber === 1"
                          (click)="goToPage(1)" aria-label="First page">
                    <span class="material-symbols-outlined text-sm">first_page</span>
                  </button>
                  <button class="join-item btn btn-sm" [disabled]="pagination.pageNumber === 1"
                          (click)="goToPage(pagination.pageNumber - 1)" aria-label="Previous page">
                    <span class="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <ng-container *ngFor="let page of visiblePages">
                    <button class="join-item btn btn-sm"
                            [class.btn-primary]="page === pagination.pageNumber"
                            (click)="goToPage(page)">{{ page }}</button>
                  </ng-container>
                  <button class="join-item btn btn-sm" [disabled]="pagination.pageNumber === pagination.totalPages"
                          (click)="goToPage(pagination.pageNumber + 1)" aria-label="Next page">
                    <span class="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                  <button class="join-item btn btn-sm" [disabled]="pagination.pageNumber === pagination.totalPages"
                          (click)="goToPage(pagination.totalPages)" aria-label="Last page">
                    <span class="material-symbols-outlined text-sm">last_page</span>
                  </button>
                </div>
                <select class="select select-bordered select-sm"
                        [(ngModel)]="pageSize" (ngModelChange)="onPageSizeChange($event)" aria-label="Page size">
                  <option [ngValue]="10">10 per page</option>
                  <option [ngValue]="20">20 per page</option>
                  <option [ngValue]="25">25 per page</option>
                  <option [ngValue]="50">50 per page</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Strip -->
      <div class="card bg-base-100 border border-base-200 shadow-sm">
        <div class="card-body p-4">
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">search</span>
              <span class="text-xs font-semibold text-base-content">Smart Search</span>
              <span class="text-[10px] text-base-content/50">Search by name or location with instant results</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">filter_list</span>
              <span class="text-xs font-semibold text-base-content">Advanced Filters</span>
              <span class="text-[10px] text-base-content/50">Filter by status, location, size, source</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">swap_vert</span>
              <span class="text-xs font-semibold text-base-content">Sortable Columns</span>
              <span class="text-[10px] text-base-content/50">Sort ascending or descending on any column</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">select_check_box</span>
              <span class="text-xs font-semibold text-base-content">Bulk Actions</span>
              <span class="text-[10px] text-base-content/50">Select multiple and perform bulk operations</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">view_column</span>
              <span class="text-xs font-semibold text-base-content">Column Customization</span>
              <span class="text-[10px] text-base-content/50">Show/hide columns to your preference</span>
            </div>
            <div class="flex flex-col items-center gap-1.5">
              <span class="material-symbols-outlined text-lg text-primary">download</span>
              <span class="text-xs font-semibold text-base-content">CSV Export</span>
              <span class="text-[10px] text-base-content/50">Export current filtered data as CSV</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OpportunityListPageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly csvExportService = inject(CsvExportService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject = new Subject<string>();

  // Store-driven state
  opportunities: IOpportunityListItem[] = [];
  loading = true;
  pagination: IPaginationMeta = { pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0 };
  currentFilters: IOpportunityFilters = {
    status: null, search: '', location: '', source: '',
    dateFrom: null, dateTo: null, sortBy: 'createdAt', sortDirection: 'desc'
  };
  bulkDeleteInProgress = false;

  // Local UI state
  selectedIds = new Set<string>();
  visibleColumns: string[] = ['name', 'location', 'landSize', 'status', 'source', 'expectedAcquisition', 'createdAt'];
  pageSize = 20;
  sortColumn = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Local filter form state (two-way bound to UI, dispatched on change)
  localFilters = { search: '', status: '' as string, location: '', source: '' };

  // Metrics computed from store data
  metrics: IOpportunityMetrics = { total: 0, active: 0, inDueDiligence: 0, acquired: 0, withdrawn: 0 };

  readonly skeletonRows = Array.from({ length: 8 });

  readonly statusOptions = [
    { value: OpportunityStatus.Identified, label: 'Identified' },
    { value: OpportunityStatus.InitialReview, label: 'Initial Review' },
    { value: OpportunityStatus.DueDiligence, label: 'Due Diligence' },
    { value: OpportunityStatus.OfferMade, label: 'Offer Made' },
    { value: OpportunityStatus.UnderContract, label: 'Under Contract' },
    { value: OpportunityStatus.Acquired, label: 'Acquired' },
    { value: OpportunityStatus.Withdrawn, label: 'Withdrawn' }
  ];

  private readonly statusBadgeMap: Record<string, string> = {
    [OpportunityStatus.Identified]: 'badge-ghost',
    [OpportunityStatus.InitialReview]: 'badge-info',
    [OpportunityStatus.DueDiligence]: 'badge-warning',
    [OpportunityStatus.OfferMade]: 'badge-primary',
    [OpportunityStatus.UnderContract]: 'badge-secondary',
    [OpportunityStatus.Acquired]: 'badge-success',
    [OpportunityStatus.Withdrawn]: 'badge-error'
  };

  private readonly statusColorMap: Record<string, string> = {
    [OpportunityStatus.Identified]: '#6366f1',
    [OpportunityStatus.InitialReview]: '#3b82f6',
    [OpportunityStatus.DueDiligence]: '#f59e0b',
    [OpportunityStatus.OfferMade]: '#8b5cf6',
    [OpportunityStatus.UnderContract]: '#06b6d4',
    [OpportunityStatus.Acquired]: '#10b981',
    [OpportunityStatus.Withdrawn]: '#ef4444'
  };

  ngOnInit(): void {
    // Subscribe to store selectors
    this.store.select(selectAllOpportunities).pipe(takeUntil(this.destroy$)).subscribe(opps => {
      this.opportunities = opps;
      this.computeMetrics();
    });

    this.store.select(selectOpportunityLoading).pipe(takeUntil(this.destroy$)).subscribe(loading => {
      this.loading = loading;
    });

    this.store.select(selectPagination).pipe(takeUntil(this.destroy$)).subscribe(pagination => {
      this.pagination = pagination;
    });

    this.store.select(selectFilters).pipe(takeUntil(this.destroy$)).subscribe(filters => {
      this.currentFilters = filters;
      this.sortColumn = filters.sortBy;
      this.sortDirection = filters.sortDirection;
    });

    this.store.select(selectBulkDeleteInProgress).pipe(takeUntil(this.destroy$)).subscribe(inProgress => {
      this.bulkDeleteInProgress = inProgress;
      if (!inProgress && this.selectedIds.size > 0) {
        this.selectedIds.clear();
      }
    });

    // Debounced search input
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      this.dispatchLoadWithFilters({ search });
    });

    // Initial load
    this.dispatchLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Computed ────────────────────────────────────────────────────────────────

  get startRecord(): number {
    if (this.pagination.totalCount === 0) return 0;
    return (this.pagination.pageNumber - 1) * this.pagination.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.pagination.pageNumber * this.pagination.pageSize, this.pagination.totalCount);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 7;
    const totalPages = this.pagination.totalPages || 1;
    let startPage = Math.max(1, this.pagination.pageNumber - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  }

  get isAllSelected(): boolean {
    return this.opportunities.length > 0 &&
           this.opportunities.every(o => this.selectedIds.has(o.id));
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.localFilters.search) count++;
    if (this.localFilters.status) count++;
    if (this.localFilters.location) count++;
    if (this.localFilters.source) count++;
    return count;
  }

  get visibleColumnCount(): number {
    return this.visibleColumns.length;
  }

  getActivePercentage(): string {
    if (this.metrics.total === 0) return '0';
    return ((this.metrics.active / this.metrics.total) * 100).toFixed(0);
  }

  // ── Column Visibility ───────────────────────────────────────────────────────

  isColumnVisible(key: string): boolean {
    return this.visibleColumns.includes(key);
  }

  onColumnsChanged(columns: string[]): void {
    this.visibleColumns = columns;
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  onFilterChange(): void {
    const filterUpdates: Partial<IOpportunityFilters> = {
      status: this.localFilters.status ? this.localFilters.status as OpportunityStatus : null,
      location: this.localFilters.location,
      source: this.localFilters.source
    };

    this.dispatchLoadWithFilters(filterUpdates);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = +size;
    this.dispatchLoadWithFilters({}, 1, this.pageSize);
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.store.dispatch(OpportunityActions.updateFilters({
      filters: { sortBy: this.sortColumn, sortDirection: this.sortDirection }
    }));
    this.dispatchLoad();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.dispatchLoadWithFilters({}, page);
  }

  // ── Saved Views ─────────────────────────────────────────────────────────────

  onViewSelected(filters: IOpportunityFilters): void {
    this.store.dispatch(OpportunityActions.updateFilters({ filters }));
    this.localFilters.search = filters.search;
    this.localFilters.status = filters.status ?? '';
    this.localFilters.location = filters.location;
    this.localFilters.source = filters.source;
    this.sortColumn = filters.sortBy;
    this.sortDirection = filters.sortDirection;
    this.dispatchLoad();
  }

  // ── Selection ───────────────────────────────────────────────────────────────

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) this.selectedIds.delete(id);
    else this.selectedIds.add(id);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.opportunities.forEach(o => this.selectedIds.delete(o.id));
    } else {
      this.opportunities.forEach(o => this.selectedIds.add(o.id));
    }
  }

  selectAll(): void {
    this.opportunities.forEach(o => this.selectedIds.add(o.id));
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  bulkDelete(): void {
    if (this.selectedIds.size === 0 || this.bulkDeleteInProgress) return;

    const count = this.selectedIds.size;
    this.confirmDialog.confirm({
      title: 'Delete Selected Opportunities',
      message: `Are you sure you want to delete ${count} ${count === 1 ? 'opportunity' : 'opportunities'}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'danger',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.store.dispatch(OpportunityActions.bulkDeleteOpportunities({
          ids: Array.from(this.selectedIds)
        }));
      }
    });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  navigateToCreate(): void {
    this.router.navigate(['/land-acquisition/opportunities/new']);
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/land-acquisition/opportunities', id]);
  }

  navigateToEdit(id: string): void {
    this.router.navigate(['/land-acquisition/opportunities', id, 'edit']);
  }

  exportOpportunities(): void {
    if (this.opportunities.length === 0) {
      this.toast.showError('No data to export.');
      return;
    }
    this.csvExportService.exportOpportunities(this.opportunities);
    this.toast.showSuccess('Export started — your file will download shortly.');
  }

  onDelete(opp: IOpportunityListItem): void {
    this.confirmDialog.confirm({
      title: 'Delete Opportunity',
      message: `Are you sure you want to delete "${opp.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      severity: 'danger',
    }).subscribe(confirmed => {
      if (confirmed) {
        this.store.dispatch(OpportunityActions.deleteOpportunity({ id: opp.id }));
      }
    });
  }

  // ── Filters ─────────────────────────────────────────────────────────────────

  resetFilters(): void {
    this.localFilters = { search: '', status: '', location: '', source: '' };
    this.sortColumn = 'createdAt';
    this.sortDirection = 'desc';
    this.store.dispatch(OpportunityActions.resetFilters());
    this.dispatchLoad();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  trackById(_index: number, opp: IOpportunityListItem): string { return opp.id; }

  getStatusBadgeClass(status: OpportunityStatus): string {
    return this.statusBadgeMap[status] ?? 'badge-ghost';
  }

  getStatusColor(status: OpportunityStatus): string {
    return this.statusColorMap[status] ?? '#6366f1';
  }

  formatStatus(status: OpportunityStatus): string {
    return status.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2').trim();
  }

  // ── Private: Dispatch Helpers ───────────────────────────────────────────────

  /**
   * Dispatch load with current filters/sort/pagination from store,
   * optionally overriding specific filter values and page.
   */
  private dispatchLoadWithFilters(
    filterOverrides: Partial<IOpportunityFilters> = {},
    pageNumber?: number,
    pageSizeOverride?: number
  ): void {
    // Update filters in store
    if (Object.keys(filterOverrides).length > 0) {
      this.store.dispatch(OpportunityActions.updateFilters({ filters: filterOverrides }));
    }

    const resolvedPageSize = pageSizeOverride ?? this.pageSize;
    const resolvedPage = pageNumber ?? 1;

    const params: IOpportunityQueryParams = {
      pageNumber: resolvedPage,
      pageSize: resolvedPageSize,
      status: (filterOverrides.status !== undefined ? filterOverrides.status : this.currentFilters.status) ?? undefined,
      search: (filterOverrides.search !== undefined ? filterOverrides.search : this.currentFilters.search) || undefined,
      sortBy: this.sortColumn || undefined,
      sortDirection: this.sortDirection || undefined
    };

    this.store.dispatch(OpportunityActions.loadOpportunitiesWithParams({ params }));
  }

  /**
   * Dispatch load using whatever is currently in the store filters + local page state.
   */
  private dispatchLoad(): void {
    const params: IOpportunityQueryParams = {
      pageNumber: this.pagination.pageNumber || 1,
      pageSize: this.pageSize,
      status: this.currentFilters.status ?? undefined,
      search: this.currentFilters.search || undefined,
      sortBy: this.sortColumn || undefined,
      sortDirection: this.sortDirection || undefined
    };
    this.store.dispatch(OpportunityActions.loadOpportunitiesWithParams({ params }));
  }

  /**
   * Compute summary metrics from the current page data.
   * Note: These are approximate metrics based on currently loaded page.
   * For accurate totals, a dedicated metrics endpoint would be ideal.
   */
  private computeMetrics(): void {
    const opps = this.opportunities;
    this.metrics = {
      total: this.pagination.totalCount || opps.length,
      active: opps.filter(o =>
        o.status !== OpportunityStatus.Withdrawn && o.status !== OpportunityStatus.Acquired
      ).length,
      inDueDiligence: opps.filter(o => o.status === OpportunityStatus.DueDiligence).length,
      acquired: opps.filter(o => o.status === OpportunityStatus.Acquired).length,
      withdrawn: opps.filter(o => o.status === OpportunityStatus.Withdrawn).length
    };
  }
}
