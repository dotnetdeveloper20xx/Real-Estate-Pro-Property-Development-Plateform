import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, BehaviorSubject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { AuditRecordActions } from '../../store/audit-records';
import {
  selectAllAuditRecords,
  selectAuditRecordLoading,
  selectAuditRecordError
} from '../../store/audit-records';
import {
  IAuditRecordListItem,
  AuditType,
  AuditRecordStatus,
  RiskRating
} from '../../models/audit-record.model';

/**
 * Audit Record List container page — displays a filterable, sortable data table
 * of all audit records.
 *
 * Responsibilities:
 * - Dispatches AuditRecordActions.loadAuditRecords on init
 * - Provides filtering by AuditType, Status, RiskRating
 * - Shows skeleton loading state while data is being fetched
 * - Shows error state with retry button on failure
 * - Navigates to audit record detail on row click
 *
 * Requirements: 9.7
 */
@Component({
  selector: 'app-audit-record-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Audit Records</h1>
          <p class="text-sm text-base-content/60">
            Track and manage all audit records. Filter by type, status, or risk rating to locate specific audits.
          </p>
        </div>
        <button
          class="btn btn-primary btn-sm"
          (click)="onCreateClick()"
          aria-label="Create a new audit record"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Audit
        </button>
      </div>

      <!-- Filtering Controls -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <!-- Audit Type Filter -->
        <div class="form-control w-full sm:w-48">
          <label class="label py-1" for="auditTypeFilter">
            <span class="label-text text-xs font-medium">Audit Type</span>
          </label>
          <select
            id="auditTypeFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedAuditType"
            (ngModelChange)="onAuditTypeChange($event)"
            aria-label="Filter audit records by type"
          >
            <option [ngValue]="undefined">All Types</option>
            @for (option of auditTypeOptions; track option.value) {
              <option [ngValue]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>

        <!-- Status Filter -->
        <div class="form-control w-full sm:w-52">
          <label class="label py-1" for="statusFilter">
            <span class="label-text text-xs font-medium">Status</span>
          </label>
          <select
            id="statusFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedStatus"
            (ngModelChange)="onStatusChange($event)"
            aria-label="Filter audit records by status"
          >
            <option [ngValue]="undefined">All Statuses</option>
            @for (option of statusOptions; track option.value) {
              <option [ngValue]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>

        <!-- Risk Rating Filter -->
        <div class="form-control w-full sm:w-44">
          <label class="label py-1" for="riskRatingFilter">
            <span class="label-text text-xs font-medium">Risk Rating</span>
          </label>
          <select
            id="riskRatingFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedRiskRating"
            (ngModelChange)="onRiskRatingChange($event)"
            aria-label="Filter audit records by risk rating"
          >
            <option [ngValue]="undefined">All Ratings</option>
            @for (option of riskRatingOptions; track option.value) {
              <option [ngValue]="option.value">{{ option.label }}</option>
            }
          </select>
        </div>

        <!-- Clear Filters Button -->
        <button
          *ngIf="hasActiveFilters()"
          class="btn btn-ghost btn-sm mt-auto"
          (click)="onClearFilters()"
          aria-label="Clear all filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      </div>

      <!-- Error State -->
      <ng-container *ngIf="error$ | async as error">
        <div
          class="flex flex-col items-center justify-center p-12 rounded-xl border border-error/30 bg-error/5"
          role="alert"
          aria-live="polite"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-error mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 class="text-lg font-semibold text-base-content mb-1">Unable to Load Audit Records</h2>
          <p class="text-sm text-base-content/60 mb-4 text-center max-w-md">
            {{ error }}
          </p>
          <button
            class="btn btn-error btn-sm"
            (click)="onRetry()"
            aria-label="Retry loading audit records"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </ng-container>

      <!-- Skeleton Loading State -->
      <ng-container *ngIf="(loading$ | async) && !(error$ | async)">
        <div class="overflow-x-auto" role="status" aria-label="Loading audit records">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Audit Type</th>
                <th>Scope</th>
                <th>Auditor</th>
                <th>Audit Date</th>
                <th>Status</th>
                <th>Risk Rating</th>
                <th>Overdue</th>
              </tr>
            </thead>
            <tbody>
              @for (row of skeletonRows; track row) {
                <tr class="animate-pulse">
                  <td><div class="h-4 w-20 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-32 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-28 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-16 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-12 bg-base-300 rounded"></div></td>
                </tr>
              }
            </tbody>
          </table>
          <span class="sr-only">Loading audit records, please wait...</span>
        </div>
      </ng-container>

      <!-- Data Table -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <ng-container *ngIf="filteredRecords.length > 0; else emptyState">
          <div class="overflow-x-auto rounded-lg border border-base-300">
            <table class="table table-sm table-zebra" aria-label="Audit records data table">
              <thead>
                <tr>
                  <th
                    class="cursor-pointer hover:bg-base-200 select-none"
                    (click)="onSort('auditType')"
                    [attr.aria-sort]="getSortAria('auditType')"
                  >
                    <span class="flex items-center gap-1">
                      Audit Type
                      <ng-container *ngIf="sortColumn === 'auditType'">
                        <span *ngIf="sortDirection === 'asc'" aria-hidden="true">▲</span>
                        <span *ngIf="sortDirection === 'desc'" aria-hidden="true">▼</span>
                      </ng-container>
                    </span>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-base-200 select-none"
                    (click)="onSort('scope')"
                    [attr.aria-sort]="getSortAria('scope')"
                  >
                    <span class="flex items-center gap-1">
                      Scope
                      <ng-container *ngIf="sortColumn === 'scope'">
                        <span *ngIf="sortDirection === 'asc'" aria-hidden="true">▲</span>
                        <span *ngIf="sortDirection === 'desc'" aria-hidden="true">▼</span>
                      </ng-container>
                    </span>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-base-200 select-none"
                    (click)="onSort('auditorName')"
                    [attr.aria-sort]="getSortAria('auditorName')"
                  >
                    <span class="flex items-center gap-1">
                      Auditor
                      <ng-container *ngIf="sortColumn === 'auditorName'">
                        <span *ngIf="sortDirection === 'asc'" aria-hidden="true">▲</span>
                        <span *ngIf="sortDirection === 'desc'" aria-hidden="true">▼</span>
                      </ng-container>
                    </span>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-base-200 select-none"
                    (click)="onSort('auditDate')"
                    [attr.aria-sort]="getSortAria('auditDate')"
                  >
                    <span class="flex items-center gap-1">
                      Audit Date
                      <ng-container *ngIf="sortColumn === 'auditDate'">
                        <span *ngIf="sortDirection === 'asc'" aria-hidden="true">▲</span>
                        <span *ngIf="sortDirection === 'desc'" aria-hidden="true">▼</span>
                      </ng-container>
                    </span>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-base-200 select-none"
                    (click)="onSort('status')"
                    [attr.aria-sort]="getSortAria('status')"
                  >
                    <span class="flex items-center gap-1">
                      Status
                      <ng-container *ngIf="sortColumn === 'status'">
                        <span *ngIf="sortDirection === 'asc'" aria-hidden="true">▲</span>
                        <span *ngIf="sortDirection === 'desc'" aria-hidden="true">▼</span>
                      </ng-container>
                    </span>
                  </th>
                  <th
                    class="cursor-pointer hover:bg-base-200 select-none"
                    (click)="onSort('riskRating')"
                    [attr.aria-sort]="getSortAria('riskRating')"
                  >
                    <span class="flex items-center gap-1">
                      Risk Rating
                      <ng-container *ngIf="sortColumn === 'riskRating'">
                        <span *ngIf="sortDirection === 'asc'" aria-hidden="true">▲</span>
                        <span *ngIf="sortDirection === 'desc'" aria-hidden="true">▼</span>
                      </ng-container>
                    </span>
                  </th>
                  <th>Overdue</th>
                </tr>
              </thead>
              <tbody>
                @for (record of filteredRecords; track record.id) {
                  <tr
                    class="hover:bg-base-200 cursor-pointer transition-colors"
                    (click)="onRecordClick(record)"
                    [attr.aria-label]="'View audit record: ' + record.scope"
                    tabindex="0"
                    (keydown.enter)="onRecordClick(record)"
                  >
                    <td>
                      <span class="badge badge-sm" [ngClass]="getAuditTypeBadgeClass(record.auditType)">
                        {{ formatAuditType(record.auditType) }}
                      </span>
                    </td>
                    <td class="font-medium text-base-content max-w-xs truncate">{{ record.scope }}</td>
                    <td class="text-base-content/80">{{ record.auditorName }}</td>
                    <td class="text-base-content/70 whitespace-nowrap">{{ formatDate(record.auditDate) }}</td>
                    <td>
                      <span class="badge badge-sm" [ngClass]="getStatusBadgeClass(record.status)">
                        {{ formatStatus(record.status) }}
                      </span>
                    </td>
                    <td>
                      <span
                        *ngIf="record.riskRating; else noRating"
                        class="badge badge-sm"
                        [ngClass]="getRiskBadgeClass(record.riskRating)"
                      >
                        {{ record.riskRating }}
                      </span>
                      <ng-template #noRating>
                        <span class="text-base-content/40 text-xs">—</span>
                      </ng-template>
                    </td>
                    <td>
                      <span
                        *ngIf="record.isOverdue"
                        class="badge badge-sm badge-error gap-1"
                        aria-label="Overdue"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Overdue
                      </span>
                      <span *ngIf="!record.isOverdue" class="text-base-content/40 text-xs">—</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </ng-container>

        <!-- Empty State -->
        <ng-template #emptyState>
          <div class="flex flex-col items-center justify-center p-16 rounded-xl border border-base-300 bg-base-100">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-base-content/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h2 class="text-lg font-semibold text-base-content mb-1">No Audit Records Found</h2>
            <p class="text-sm text-base-content/60 text-center max-w-sm mb-4" *ngIf="hasActiveFilters()">
              No audit records match your current filters. Try adjusting or clearing your filters.
            </p>
            <p class="text-sm text-base-content/60 text-center max-w-sm mb-4" *ngIf="!hasActiveFilters()">
              Create your first audit record to begin tracking audits, compliance checks, and risk assessments.
            </p>
            <button
              *ngIf="hasActiveFilters()"
              class="btn btn-ghost btn-sm"
              (click)="onClearFilters()"
            >
              Clear Filters
            </button>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `
})
export class AuditRecordListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly filters$ = new BehaviorSubject<FilterState>({
    auditType: undefined,
    status: undefined,
    riskRating: undefined,
    sortColumn: 'auditDate',
    sortDirection: 'desc'
  });

  /** Observable of all audit records from the store. */
  private readonly allRecords$: Observable<readonly IAuditRecordListItem[]> =
    this.store.select(selectAllAuditRecords);

  /** Observable of loading state. */
  readonly loading$: Observable<boolean> = this.store.select(selectAuditRecordLoading);

  /** Observable of error state. */
  readonly error$: Observable<string | null> = this.store.select(selectAuditRecordError);

  /** Audit type filter options. */
  readonly auditTypeOptions: readonly FilterOption<AuditType>[] = [
    { value: AuditType.Internal, label: 'Internal' },
    { value: AuditType.External, label: 'External' },
    { value: AuditType.Regulatory, label: 'Regulatory' },
    { value: AuditType.SpotCheck, label: 'Spot Check' }
  ];

  /** Status filter options. */
  readonly statusOptions: readonly FilterOption<AuditRecordStatus>[] = [
    { value: AuditRecordStatus.Planned, label: 'Planned' },
    { value: AuditRecordStatus.InProgress, label: 'In Progress' },
    { value: AuditRecordStatus.FindingsRecorded, label: 'Findings Recorded' },
    { value: AuditRecordStatus.ActionsRequired, label: 'Actions Required' },
    { value: AuditRecordStatus.RemediationInProgress, label: 'Remediation In Progress' },
    { value: AuditRecordStatus.Verified, label: 'Verified' },
    { value: AuditRecordStatus.Closed, label: 'Closed' }
  ];

  /** Risk rating filter options. */
  readonly riskRatingOptions: readonly FilterOption<RiskRating>[] = [
    { value: RiskRating.Low, label: 'Low' },
    { value: RiskRating.Medium, label: 'Medium' },
    { value: RiskRating.High, label: 'High' },
    { value: RiskRating.Critical, label: 'Critical' }
  ];

  /** Skeleton rows for loading state. */
  readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  /** Current filter state. */
  selectedAuditType: AuditType | undefined = undefined;
  selectedStatus: AuditRecordStatus | undefined = undefined;
  selectedRiskRating: RiskRating | undefined = undefined;

  /** Sorting state. */
  sortColumn: SortableColumn = 'auditDate';
  sortDirection: 'asc' | 'desc' = 'desc';

  /** Client-side filtered and sorted records. */
  filteredRecords: readonly IAuditRecordListItem[] = [];

  ngOnInit(): void {
    this.store.dispatch(AuditRecordActions.loadAuditRecords());

    combineLatest([this.allRecords$, this.filters$]).pipe(
      map(([records, filters]) => this.applyFiltersAndSort(records, filters)),
      takeUntil(this.destroy$)
    ).subscribe((records) => {
      this.filteredRecords = records;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Handles audit type filter change. */
  onAuditTypeChange(auditType: AuditType | undefined): void {
    this.selectedAuditType = auditType;
    this.emitFilters();
  }

  /** Handles status filter change. */
  onStatusChange(status: AuditRecordStatus | undefined): void {
    this.selectedStatus = status;
    this.emitFilters();
  }

  /** Handles risk rating filter change. */
  onRiskRatingChange(riskRating: RiskRating | undefined): void {
    this.selectedRiskRating = riskRating;
    this.emitFilters();
  }

  /** Clears all active filters. */
  onClearFilters(): void {
    this.selectedAuditType = undefined;
    this.selectedStatus = undefined;
    this.selectedRiskRating = undefined;
    this.emitFilters();
  }

  /** Handles column sort click. */
  onSort(column: SortableColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.emitFilters();
  }

  /** Navigates to audit record detail page on row click. */
  onRecordClick(record: IAuditRecordListItem): void {
    this.router.navigate(['/legal-compliance', 'audit-records', record.id]);
  }

  /** Navigates to audit record create page. */
  onCreateClick(): void {
    this.router.navigate(['/legal-compliance', 'audit-records', 'create']);
  }

  /** Retries loading audit records. */
  onRetry(): void {
    this.store.dispatch(AuditRecordActions.loadAuditRecords());
  }

  /** Returns true if any filter is actively applied. */
  hasActiveFilters(): boolean {
    return this.selectedAuditType !== undefined ||
      this.selectedStatus !== undefined ||
      this.selectedRiskRating !== undefined;
  }

  /** Returns ARIA sort attribute value for accessibility. */
  getSortAria(column: SortableColumn): string {
    if (this.sortColumn !== column) {
      return 'none';
    }
    return this.sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  /** Returns badge CSS class for audit type. */
  getAuditTypeBadgeClass(auditType: AuditType): string {
    switch (auditType) {
      case AuditType.Internal:
        return 'badge-info';
      case AuditType.External:
        return 'badge-primary';
      case AuditType.Regulatory:
        return 'badge-warning';
      case AuditType.SpotCheck:
        return 'badge-accent';
    }
  }

  /** Returns badge CSS class for status. */
  getStatusBadgeClass(status: AuditRecordStatus): string {
    switch (status) {
      case AuditRecordStatus.Planned:
        return 'badge-ghost';
      case AuditRecordStatus.InProgress:
        return 'badge-info';
      case AuditRecordStatus.FindingsRecorded:
        return 'badge-warning';
      case AuditRecordStatus.ActionsRequired:
        return 'badge-error';
      case AuditRecordStatus.RemediationInProgress:
        return 'badge-accent';
      case AuditRecordStatus.Verified:
        return 'badge-success';
      case AuditRecordStatus.Closed:
        return 'badge-neutral';
    }
  }

  /** Returns badge CSS class for risk rating. */
  getRiskBadgeClass(riskRating: RiskRating): string {
    switch (riskRating) {
      case RiskRating.Low:
        return 'badge-success';
      case RiskRating.Medium:
        return 'badge-warning';
      case RiskRating.High:
        return 'badge-error';
      case RiskRating.Critical:
        return 'badge-error badge-outline';
    }
  }

  /** Formats audit type for display. */
  formatAuditType(auditType: AuditType): string {
    switch (auditType) {
      case AuditType.Internal:
        return 'Internal';
      case AuditType.External:
        return 'External';
      case AuditType.Regulatory:
        return 'Regulatory';
      case AuditType.SpotCheck:
        return 'Spot Check';
    }
  }

  /** Formats status enum for display. */
  formatStatus(status: AuditRecordStatus): string {
    switch (status) {
      case AuditRecordStatus.Planned:
        return 'Planned';
      case AuditRecordStatus.InProgress:
        return 'In Progress';
      case AuditRecordStatus.FindingsRecorded:
        return 'Findings Recorded';
      case AuditRecordStatus.ActionsRequired:
        return 'Actions Required';
      case AuditRecordStatus.RemediationInProgress:
        return 'Remediation';
      case AuditRecordStatus.Verified:
        return 'Verified';
      case AuditRecordStatus.Closed:
        return 'Closed';
    }
  }

  /** Formats ISO date string for display. */
  formatDate(isoDate: string): string {
    if (!isoDate) {
      return '—';
    }
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** Emits current filter state to trigger reactive update. */
  private emitFilters(): void {
    this.filters$.next({
      auditType: this.selectedAuditType,
      status: this.selectedStatus,
      riskRating: this.selectedRiskRating,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    });
  }

  /** Applies current filters and sorting to the provided records. */
  private applyFiltersAndSort(
    records: readonly IAuditRecordListItem[],
    filters: FilterState
  ): readonly IAuditRecordListItem[] {
    let filtered = [...records];

    // Apply filters
    if (filters.auditType !== undefined) {
      filtered = filtered.filter((r) => r.auditType === filters.auditType);
    }
    if (filters.status !== undefined) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }
    if (filters.riskRating !== undefined) {
      filtered = filtered.filter((r) => r.riskRating === filters.riskRating);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = this.getSortValue(a, filters.sortColumn);
      const bVal = this.getSortValue(b, filters.sortColumn);

      let comparison = 0;
      if (aVal < bVal) {
        comparison = -1;
      } else if (aVal > bVal) {
        comparison = 1;
      }

      return filters.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }

  /** Extracts a comparable sort value from a record by column. */
  private getSortValue(record: IAuditRecordListItem, column: SortableColumn): string {
    switch (column) {
      case 'auditType':
        return record.auditType;
      case 'scope':
        return record.scope.toLowerCase();
      case 'auditorName':
        return record.auditorName.toLowerCase();
      case 'auditDate':
        return record.auditDate;
      case 'status':
        return record.status;
      case 'riskRating':
        return record.riskRating ?? '';
    }
  }
}

/** Columns available for sorting. */
type SortableColumn = 'auditType' | 'scope' | 'auditorName' | 'auditDate' | 'status' | 'riskRating';

/** Internal filter state for reactive filtering. */
interface FilterState {
  readonly auditType: AuditType | undefined;
  readonly status: AuditRecordStatus | undefined;
  readonly riskRating: RiskRating | undefined;
  readonly sortColumn: SortableColumn;
  readonly sortDirection: 'asc' | 'desc';
}

/** Helper type for filter dropdown options. */
interface FilterOption<T> {
  readonly value: T;
  readonly label: string;
}
