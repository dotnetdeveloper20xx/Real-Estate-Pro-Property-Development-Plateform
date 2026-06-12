import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { ContractActions, IContractFilterParams } from '../../store/contracts';
import {
  selectAllContracts,
  selectContractsLoading,
  selectContractsError,
  selectContractsPagination
} from '../../store/contracts';
import { ContractRegisterTableComponent } from '../../components/contract-register-table/contract-register-table.component';
import { IContractListItem, LegalContractStatus, LegalContractType } from '../../models/contract.model';

/**
 * Contract Register container page — displays a paginated, filterable data table
 * of all contracts using the contract-register-table reusable component.
 *
 * Responsibilities:
 * - Dispatches ContractActions.loadRegister on init
 * - Provides filtering by Status and ContractType dropdowns and a search input
 * - Manages pagination state and dispatches filter changes
 * - Shows skeleton loading state while data is being fetched
 * - Shows error state with retry button on failure
 * - Navigates to contract detail on row click
 *
 * Requirements: 14.3
 */
@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ContractRegisterTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Contract Register</h1>
          <p class="text-sm text-base-content/60">
            Browse and manage all contracts. Use filters to find specific agreements by status, type, or keyword.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span
            *ngIf="pagination$ | async as pagination"
            class="badge badge-neutral badge-outline text-xs"
          >
            {{ pagination.totalCount }} contracts
          </span>
        </div>
      </div>

      <!-- Filtering Controls -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <!-- Status Filter -->
        <div class="form-control w-full sm:w-48">
          <label class="label py-1" for="statusFilter">
            <span class="label-text text-xs font-medium">Status</span>
          </label>
          <select
            id="statusFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedStatus"
            (ngModelChange)="onStatusChange($event)"
            aria-label="Filter contracts by status"
          >
            <option [ngValue]="undefined">All Statuses</option>
            @for (status of statusOptions; track status.value) {
              <option [ngValue]="status.value">{{ status.label }}</option>
            }
          </select>
        </div>

        <!-- Contract Type Filter -->
        <div class="form-control w-full sm:w-52">
          <label class="label py-1" for="typeFilter">
            <span class="label-text text-xs font-medium">Contract Type</span>
          </label>
          <select
            id="typeFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedType"
            (ngModelChange)="onTypeChange($event)"
            aria-label="Filter contracts by type"
          >
            <option [ngValue]="undefined">All Types</option>
            @for (type of typeOptions; track type.value) {
              <option [ngValue]="type.value">{{ type.label }}</option>
            }
          </select>
        </div>

        <!-- Search Input -->
        <div class="form-control w-full sm:w-64">
          <label class="label py-1" for="searchInput">
            <span class="label-text text-xs font-medium">Search</span>
          </label>
          <div class="relative">
            <input
              id="searchInput"
              type="text"
              class="input input-bordered input-sm w-full pl-9"
              placeholder="Search by reference, title, or counterparty..."
              [ngModel]="searchTerm"
              (ngModelChange)="onSearchChange($event)"
              aria-label="Search contracts"
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
          <h2 class="text-lg font-semibold text-base-content mb-1">Unable to Load Contracts</h2>
          <p class="text-sm text-base-content/60 mb-4 text-center max-w-md">
            {{ error }}
          </p>
          <button
            class="btn btn-error btn-sm"
            (click)="onRetry()"
            aria-label="Retry loading contract register"
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
        <div class="overflow-x-auto" role="status" aria-label="Loading contract register data">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Counterparty</th>
                <th class="text-right">Value</th>
                <th>Start</th>
                <th>End</th>
                <th>Case Ref</th>
              </tr>
            </thead>
            <tbody>
              @for (row of skeletonRows; track row) {
                <tr class="animate-pulse">
                  <td><div class="h-3 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-32 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-20 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-16 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-28 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-20 bg-base-300 rounded ml-auto"></div></td>
                  <td><div class="h-3 w-20 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-20 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-24 bg-base-300 rounded"></div></td>
                </tr>
              }
            </tbody>
          </table>
          <span class="sr-only">Loading contract register data, please wait...</span>
        </div>
      </ng-container>

      <!-- Contract Register Table -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <app-contract-register-table
          [contracts]="(contracts$ | async) ?? []"
          (rowClick)="onContractClick($event)"
        />
      </ng-container>

      <!-- Pagination Controls -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <ng-container *ngIf="pagination$ | async as pagination">
          <div
            *ngIf="pagination.totalPages > 1"
            class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2"
            role="navigation"
            aria-label="Contract register pagination"
          >
            <p class="text-xs text-base-content/60">
              Showing page {{ pagination.currentPage }} of {{ pagination.totalPages }}
              ({{ pagination.totalCount }} contracts total)
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
export class ContractListComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly searchSubject$ = new Subject<string>();

  /** Observable of all contracts in the current entity state. */
  readonly contracts$: Observable<readonly IContractListItem[]> =
    this.store.select(selectAllContracts);

  /** Observable of loading state. */
  readonly loading$: Observable<boolean> = this.store.select(selectContractsLoading);

  /** Observable of error state. */
  readonly error$: Observable<string | null> = this.store.select(selectContractsError);

  /** Observable of pagination metadata. */
  readonly pagination$: Observable<{
    totalCount: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  }> = this.store.select(selectContractsPagination);

  /** Status filter options derived from the LegalContractStatus enum. */
  readonly statusOptions: readonly FilterOption<LegalContractStatus>[] = [
    { value: LegalContractStatus.Draft, label: 'Draft' },
    { value: LegalContractStatus.UnderReview, label: 'Under Review' },
    { value: LegalContractStatus.Approved, label: 'Approved' },
    { value: LegalContractStatus.AwaitingSignature, label: 'Awaiting Signature' },
    { value: LegalContractStatus.Executed, label: 'Executed' },
    { value: LegalContractStatus.Active, label: 'Active' },
    { value: LegalContractStatus.Completed, label: 'Completed' },
    { value: LegalContractStatus.Terminated, label: 'Terminated' },
    { value: LegalContractStatus.Expired, label: 'Expired' },
    { value: LegalContractStatus.UnderDispute, label: 'Under Dispute' },
    { value: LegalContractStatus.Renewed, label: 'Renewed' },
    { value: LegalContractStatus.Cancelled, label: 'Cancelled' },
    { value: LegalContractStatus.Rejected, label: 'Rejected' },
    { value: LegalContractStatus.Closed, label: 'Closed' }
  ];

  /** Contract type filter options derived from the LegalContractType enum. */
  readonly typeOptions: readonly FilterOption<LegalContractType>[] = [
    { value: LegalContractType.LandPurchase, label: 'Land Purchase' },
    { value: LegalContractType.Construction, label: 'Construction' },
    { value: LegalContractType.ProfessionalServices, label: 'Professional Services' },
    { value: LegalContractType.Insurance, label: 'Insurance' },
    { value: LegalContractType.Lease, label: 'Lease' },
    { value: LegalContractType.Settlement, label: 'Settlement' },
    { value: LegalContractType.FrameworkAgreement, label: 'Framework Agreement' }
  ];

  /** Available page size options. */
  readonly pageSizeOptions: readonly number[] = [10, 25, 50];

  /** Skeleton rows for loading state. */
  readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  /** Current filter state. */
  selectedStatus: LegalContractStatus | undefined = undefined;
  selectedType: LegalContractType | undefined = undefined;
  searchTerm = '';
  currentPageSize = 10;

  ngOnInit(): void {
    this.loadContracts();

    // Debounce search input to avoid excessive API calls
    this.searchSubject$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadContracts(1);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Handles status filter change. */
  onStatusChange(status: LegalContractStatus | undefined): void {
    this.selectedStatus = status;
    this.loadContracts(1);
  }

  /** Handles contract type filter change. */
  onTypeChange(type: LegalContractType | undefined): void {
    this.selectedType = type;
    this.loadContracts(1);
  }

  /** Handles search input change with debounce. */
  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.searchSubject$.next(term);
  }

  /** Clears all active filters and reloads. */
  onClearFilters(): void {
    this.selectedStatus = undefined;
    this.selectedType = undefined;
    this.searchTerm = '';
    this.loadContracts(1);
  }

  /** Navigates to contract detail page on row click. */
  onContractClick(contract: IContractListItem): void {
    this.router.navigate(['/legal-compliance', 'contracts', contract.id]);
  }

  /** Changes the current page and reloads data. */
  onPageChange(page: number): void {
    this.loadContracts(page);
  }

  /** Changes the page size and reloads from page 1. */
  onPageSizeChange(size: number): void {
    this.currentPageSize = size;
    this.loadContracts(1);
  }

  /** Retries loading contract register data. */
  onRetry(): void {
    this.loadContracts();
  }

  /** Returns true if any filter is actively applied. */
  hasActiveFilters(): boolean {
    return this.selectedStatus !== undefined ||
      this.selectedType !== undefined ||
      this.searchTerm.trim().length > 0;
  }

  /**
   * Dispatches the loadRegister action with current filter and pagination parameters.
   */
  private loadContracts(page?: number): void {
    const params: IContractFilterParams = {
      pageNumber: page ?? 1,
      pageSize: this.currentPageSize,
      status: this.selectedStatus,
      contractType: this.selectedType,
      search: this.searchTerm.trim() || undefined
    };
    this.store.dispatch(ContractActions.loadRegister({ params }));
  }
}

/** Helper type for filter dropdown options. */
interface FilterOption<T> {
  readonly value: T;
  readonly label: string;
}
