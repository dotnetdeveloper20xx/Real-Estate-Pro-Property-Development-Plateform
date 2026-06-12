import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import {
  InsuranceActions,
  IInsuranceFilterParams,
  InsurancePagination,
  selectAllInsuranceRecords,
  selectInsuranceLoading,
  selectInsuranceError,
  selectInsurancePagination,
  selectExpiringSoonRecords
} from '../../store/insurance';
import { InsuranceAlertCardComponent } from '../../components/insurance-alert-card/insurance-alert-card.component';
import {
  IInsuranceRecordListItem,
  InsuranceStatus,
  CoverageType
} from '../../models/insurance-record.model';

/**
 * Insurance List container page — displays a paginated, filterable data table
 * of all insurance records with expiring policies alert section at the top.
 *
 * Responsibilities:
 * - Dispatches InsuranceActions.loadInsuranceRecords on init
 * - Shows expiring/expired policies in an alert card section at the top
 * - Provides data table with PolicyNumber, Insurer, CoverageType, CoverAmount,
 *   Currency, ExpiryDate, Status, DaysUntilExpiry columns
 * - Filtering by CoverageType, Status, Insurer
 * - Pagination with page size selection
 * - Skeleton loading state while data is being fetched
 * - Error state with retry button on failure
 * - Navigates to insurance detail on row click
 *
 * Requirements: 7.7
 */
@Component({
  selector: 'app-insurance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InsuranceAlertCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Insurance Register</h1>
          <p class="text-sm text-base-content/60">
            Browse and manage all insurance policies. Monitor expiring policies and coverage status across the portfolio.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span
            *ngIf="pagination$ | async as pagination"
            class="badge badge-neutral badge-outline text-xs"
          >
            {{ pagination.totalCount }} policies
          </span>
        </div>
      </div>

      <!-- Expiring Policies Alert Section -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <ng-container *ngIf="expiringPolicies$ | async as expiringPolicies">
          <div *ngIf="expiringPolicies.length > 0" class="space-y-3">
            <div class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 class="text-sm font-semibold text-base-content">
                Policies Requiring Attention ({{ expiringPolicies.length }})
              </h2>
            </div>
            <div
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              role="list"
              aria-label="Expiring insurance policies"
            >
              @for (record of expiringPolicies; track record.id) {
                <app-insurance-alert-card
                  [insuranceRecord]="record"
                  (cardClick)="onInsuranceClick($event)"
                />
              }
            </div>
          </div>
        </ng-container>
      </ng-container>

      <!-- Filtering Controls -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <!-- Coverage Type Filter -->
        <div class="form-control w-full sm:w-52">
          <label class="label py-1" for="coverageTypeFilter">
            <span class="label-text text-xs font-medium">Coverage Type</span>
          </label>
          <select
            id="coverageTypeFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedCoverageType"
            (ngModelChange)="onCoverageTypeChange($event)"
            aria-label="Filter by coverage type"
          >
            <option [ngValue]="undefined">All Coverage Types</option>
            @for (type of coverageTypeOptions; track type.value) {
              <option [ngValue]="type.value">{{ type.label }}</option>
            }
          </select>
        </div>

        <!-- Status Filter -->
        <div class="form-control w-full sm:w-44">
          <label class="label py-1" for="statusFilter">
            <span class="label-text text-xs font-medium">Status</span>
          </label>
          <select
            id="statusFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedStatus"
            (ngModelChange)="onStatusChange($event)"
            aria-label="Filter by status"
          >
            <option [ngValue]="undefined">All Statuses</option>
            @for (status of statusOptions; track status.value) {
              <option [ngValue]="status.value">{{ status.label }}</option>
            }
          </select>
        </div>

        <!-- Insurer Search -->
        <div class="form-control w-full sm:w-56">
          <label class="label py-1" for="insurerSearch">
            <span class="label-text text-xs font-medium">Insurer</span>
          </label>
          <div class="relative">
            <input
              id="insurerSearch"
              type="text"
              class="input input-bordered input-sm w-full pl-9"
              placeholder="Search by insurer name..."
              [ngModel]="searchInsurer"
              (ngModelChange)="onInsurerSearchChange($event)"
              aria-label="Filter by insurer name"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
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
          <h2 class="text-lg font-semibold text-base-content mb-1">Unable to Load Insurance Records</h2>
          <p class="text-sm text-base-content/60 mb-4 text-center max-w-md">
            {{ error }}
          </p>
          <button
            class="btn btn-error btn-sm"
            (click)="onRetry()"
            aria-label="Retry loading insurance records"
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
        <div class="overflow-x-auto" role="status" aria-label="Loading insurance records data">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Policy Number</th>
                <th>Insurer</th>
                <th>Coverage Type</th>
                <th class="text-right">Cover Amount</th>
                <th>Currency</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th class="text-right">Days Until Expiry</th>
              </tr>
            </thead>
            <tbody>
              @for (row of skeletonRows; track row) {
                <tr class="animate-pulse">
                  <td><div class="h-3 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-28 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-28 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-20 bg-base-300 rounded ml-auto"></div></td>
                  <td><div class="h-3 w-10 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-20 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-12 bg-base-300 rounded ml-auto"></div></td>
                </tr>
              }
            </tbody>
          </table>
          <span class="sr-only">Loading insurance records, please wait...</span>
        </div>
      </ng-container>

      <!-- Data Table -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <ng-container *ngIf="records$ | async as records">
          <!-- Empty State -->
          <div
            *ngIf="records.length === 0"
            class="flex flex-col items-center justify-center p-12 rounded-xl border border-base-200 bg-base-100"
            role="status"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 class="text-lg font-semibold text-base-content mb-1">No Insurance Records Found</h2>
            <p class="text-sm text-base-content/60 text-center max-w-md">
              {{ hasActiveFilters() ? 'No records match your current filters. Try adjusting or clearing filters.' : 'Create your first insurance policy to begin tracking coverage across the portfolio.' }}
            </p>
          </div>

          <!-- Data Table -->
          <div *ngIf="records.length > 0" class="overflow-x-auto">
            <table
              class="table table-sm table-zebra"
              role="grid"
              aria-label="Insurance records table"
            >
              <thead>
                <tr>
                  <th>
                    <button
                      class="flex items-center gap-1 hover:text-primary transition-colors"
                      (click)="onSortChange('policyNumber')"
                      [attr.aria-sort]="getSortDirection('policyNumber')"
                      aria-label="Sort by policy number"
                    >
                      Policy Number
                      <span *ngIf="currentSortBy === 'policyNumber'" class="text-xs">
                        {{ currentSortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                    </button>
                  </th>
                  <th>Insurer</th>
                  <th>Coverage Type</th>
                  <th>
                    <button
                      class="flex items-center gap-1 hover:text-primary transition-colors ml-auto"
                      (click)="onSortChange('coverAmount')"
                      [attr.aria-sort]="getSortDirection('coverAmount')"
                      aria-label="Sort by cover amount"
                    >
                      Cover Amount
                      <span *ngIf="currentSortBy === 'coverAmount'" class="text-xs">
                        {{ currentSortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                    </button>
                  </th>
                  <th>Currency</th>
                  <th>
                    <button
                      class="flex items-center gap-1 hover:text-primary transition-colors"
                      (click)="onSortChange('expiryDate')"
                      [attr.aria-sort]="getSortDirection('expiryDate')"
                      aria-label="Sort by expiry date"
                    >
                      Expiry Date
                      <span *ngIf="currentSortBy === 'expiryDate'" class="text-xs">
                        {{ currentSortDirection === 'asc' ? '↑' : '↓' }}
                      </span>
                    </button>
                  </th>
                  <th>Status</th>
                  <th class="text-right">Days Until Expiry</th>
                </tr>
              </thead>
              <tbody>
                @for (record of records; track record.id) {
                  <tr
                    class="hover:bg-base-200/50 cursor-pointer transition-colors"
                    (click)="onInsuranceClick(record)"
                    (keydown.enter)="onInsuranceClick(record)"
                    tabindex="0"
                    role="row"
                    [attr.aria-label]="'Insurance policy ' + record.policyNumber"
                  >
                    <td class="font-mono text-sm">{{ record.policyNumber }}</td>
                    <td class="text-sm truncate max-w-48" [title]="record.insurer">{{ record.insurer }}</td>
                    <td>
                      <span class="badge badge-sm badge-outline">
                        {{ formatCoverageType(record.coverageType) }}
                      </span>
                    </td>
                    <td class="text-right font-mono text-sm">
                      {{ record.coverAmount | number:'1.2-2' }}
                    </td>
                    <td class="text-sm text-base-content/70">{{ record.currency }}</td>
                    <td class="text-sm">{{ record.expiryDate | date:'dd MMM yyyy' }}</td>
                    <td>
                      <span class="badge badge-sm" [ngClass]="getStatusBadgeClass(record.status)">
                        {{ formatStatus(record.status) }}
                      </span>
                    </td>
                    <td class="text-right">
                      <span class="text-sm font-semibold" [ngClass]="getDaysClass(record)">
                        {{ getDaysUntilExpiryLabel(record) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </ng-container>
      </ng-container>

      <!-- Pagination Controls -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <ng-container *ngIf="pagination$ | async as pagination">
          <div
            *ngIf="pagination.totalPages > 1"
            class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
            role="navigation"
            aria-label="Insurance records pagination"
          >
            <p class="text-xs text-base-content/60">
              Showing page {{ pagination.currentPage }} of {{ pagination.totalPages }}
              ({{ pagination.totalCount }} records total)
            </p>
            <div class="join">
              <button
                class="join-item btn btn-sm"
                [disabled]="pagination.currentPage <= 1"
                (click)="onPageChange(1)"
                aria-label="Go to first page"
              >
                «
              </button>
              <button
                class="join-item btn btn-sm"
                [disabled]="pagination.currentPage <= 1"
                (click)="onPageChange(pagination.currentPage - 1)"
                aria-label="Go to previous page"
              >
                ‹
              </button>
              <button class="join-item btn btn-sm btn-active" aria-current="page">
                {{ pagination.currentPage }}
              </button>
              <button
                class="join-item btn btn-sm"
                [disabled]="pagination.currentPage >= pagination.totalPages"
                (click)="onPageChange(pagination.currentPage + 1)"
                aria-label="Go to next page"
              >
                ›
              </button>
              <button
                class="join-item btn btn-sm"
                [disabled]="pagination.currentPage >= pagination.totalPages"
                (click)="onPageChange(pagination.totalPages)"
                aria-label="Go to last page"
              >
                »
              </button>
            </div>
            <div class="form-control">
              <select
                class="select select-bordered select-xs"
                [ngModel]="currentPageSize"
                (ngModelChange)="onPageSizeChange($event)"
                aria-label="Rows per page"
              >
                @for (size of pageSizeOptions; track size) {
                  <option [ngValue]="size">{{ size }} per page</option>
                }
              </select>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `
})
export class InsuranceListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly insurerSearchSubject$ = new Subject<string>();

  /** Observable of all insurance records in the current entity state. */
  readonly records$: Observable<readonly IInsuranceRecordListItem[]> =
    this.store.select(selectAllInsuranceRecords);

  /** Observable of loading state. */
  readonly loading$: Observable<boolean> = this.store.select(selectInsuranceLoading);

  /** Observable of error state. */
  readonly error$: Observable<string | null> = this.store.select(selectInsuranceError);

  /** Observable of pagination metadata. */
  readonly pagination$: Observable<InsurancePagination> =
    this.store.select(selectInsurancePagination);

  /** Observable of policies that are expiring soon or already expired. */
  readonly expiringPolicies$: Observable<readonly IInsuranceRecordListItem[]> =
    this.store.select(selectExpiringSoonRecords);

  /** Coverage type filter options. */
  readonly coverageTypeOptions: readonly FilterOption<CoverageType>[] = [
    { value: CoverageType.ProfessionalIndemnity, label: 'Professional Indemnity' },
    { value: CoverageType.PublicLiability, label: 'Public Liability' },
    { value: CoverageType.EmployersLiability, label: "Employers' Liability" },
    { value: CoverageType.BuildingInsurance, label: 'Building Insurance' },
    { value: CoverageType.TitleInsurance, label: 'Title Insurance' },
    { value: CoverageType.ContractorsAllRisk, label: "Contractors' All Risk" },
    { value: CoverageType.LegalExpenses, label: 'Legal Expenses' }
  ];

  /** Status filter options. */
  readonly statusOptions: readonly FilterOption<InsuranceStatus>[] = [
    { value: InsuranceStatus.Active, label: 'Active' },
    { value: InsuranceStatus.ExpiringSoon, label: 'Expiring Soon' },
    { value: InsuranceStatus.Expired, label: 'Expired' },
    { value: InsuranceStatus.Renewed, label: 'Renewed' },
    { value: InsuranceStatus.Cancelled, label: 'Cancelled' },
    { value: InsuranceStatus.Closed, label: 'Closed' }
  ];

  /** Available page size options. */
  readonly pageSizeOptions: readonly number[] = [10, 25, 50];

  /** Skeleton rows for loading state. */
  readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  /** Current filter state. */
  selectedCoverageType: CoverageType | undefined = undefined;
  selectedStatus: InsuranceStatus | undefined = undefined;
  searchInsurer = '';
  currentPageSize = 10;
  currentSortBy = 'expiryDate';
  currentSortDirection: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.loadRecords();

    // Debounce insurer search input
    this.insurerSearchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadRecords(1);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Handles coverage type filter change. */
  onCoverageTypeChange(coverageType: CoverageType | undefined): void {
    this.selectedCoverageType = coverageType;
    this.loadRecords(1);
  }

  /** Handles status filter change. */
  onStatusChange(status: InsuranceStatus | undefined): void {
    this.selectedStatus = status;
    this.loadRecords(1);
  }

  /** Handles insurer search input change with debounce. */
  onInsurerSearchChange(term: string): void {
    this.searchInsurer = term;
    this.insurerSearchSubject$.next(term);
  }

  /** Clears all active filters and reloads. */
  onClearFilters(): void {
    this.selectedCoverageType = undefined;
    this.selectedStatus = undefined;
    this.searchInsurer = '';
    this.loadRecords(1);
  }

  /** Navigates to insurance detail page on row click. */
  onInsuranceClick(record: IInsuranceRecordListItem): void {
    this.router.navigate(['/legal-compliance', 'insurance', record.id]);
  }

  /** Changes the current page and reloads data. */
  onPageChange(page: number): void {
    this.loadRecords(page);
  }

  /** Changes the page size and reloads from page 1. */
  onPageSizeChange(size: number): void {
    this.currentPageSize = size;
    this.loadRecords(1);
  }

  /** Handles sort column click. */
  onSortChange(column: string): void {
    if (this.currentSortBy === column) {
      this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSortBy = column;
      this.currentSortDirection = 'asc';
    }
    this.loadRecords(1);
  }

  /** Returns aria-sort attribute value for the given column. */
  getSortDirection(column: string): string {
    if (this.currentSortBy !== column) {
      return 'none';
    }
    return this.currentSortDirection === 'asc' ? 'ascending' : 'descending';
  }

  /** Retries loading insurance records. */
  onRetry(): void {
    this.loadRecords();
  }

  /** Returns true if any filter is actively applied. */
  hasActiveFilters(): boolean {
    return this.selectedCoverageType !== undefined ||
      this.selectedStatus !== undefined ||
      this.searchInsurer.trim().length > 0;
  }

  /** Formats CoverageType enum to readable label. */
  formatCoverageType(type: CoverageType): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Formats PascalCase status to a readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Returns DaisyUI badge class based on insurance status. */
  getStatusBadgeClass(status: InsuranceStatus): string {
    switch (status) {
      case InsuranceStatus.Active:
        return 'badge-success';
      case InsuranceStatus.ExpiringSoon:
        return 'badge-warning';
      case InsuranceStatus.Expired:
        return 'badge-error';
      case InsuranceStatus.Renewed:
        return 'badge-info';
      case InsuranceStatus.Cancelled:
        return 'badge-neutral';
      case InsuranceStatus.Closed:
        return 'badge-ghost';
      default:
        return 'badge-ghost';
    }
  }

  /** Calculates days until expiry for a given record. */
  getDaysUntilExpiry(record: IInsuranceRecordListItem): number {
    const expiry = new Date(record.expiryDate);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /** Returns a readable label for days until expiry. */
  getDaysUntilExpiryLabel(record: IInsuranceRecordListItem): string {
    const days = this.getDaysUntilExpiry(record);
    if (days < 0) {
      return `${Math.abs(days)}d overdue`;
    }
    if (days === 0) {
      return 'Today';
    }
    return `${days}d`;
  }

  /** Returns colour class based on days until expiry. */
  getDaysClass(record: IInsuranceRecordListItem): string {
    const days = this.getDaysUntilExpiry(record);
    if (days < 0) {
      return 'text-error';
    }
    if (days < 30) {
      return 'text-warning';
    }
    return 'text-success';
  }

  /**
   * Dispatches the loadInsuranceRecords action with current filter and pagination parameters.
   */
  private loadRecords(page?: number): void {
    const params: IInsuranceFilterParams = {
      pageNumber: page ?? 1,
      pageSize: this.currentPageSize,
      status: this.selectedStatus,
      coverageType: this.selectedCoverageType,
      insurer: this.searchInsurer.trim() || undefined,
      sortBy: this.currentSortBy,
      sortDirection: this.currentSortDirection
    };
    this.store.dispatch(InsuranceActions.loadInsuranceRecords({ params }));
  }
}

/** Helper type for filter dropdown options. */
interface FilterOption<T> {
  readonly value: T;
  readonly label: string;
}
