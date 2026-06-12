import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  ComplianceRequirementActions,
  selectColorCodedChecklist,
  selectChecklistLoading,
  selectRequirementsError,
  IColorCodedChecklistItem,
  ComplianceStatusColor
} from '../../store/compliance';
import { ComplianceStatusBadgeComponent } from '../../components/compliance-status-badge/compliance-status-badge.component';
import {
  ComplianceCategory,
  ComplianceFrequency,
  ComplianceCheckOutcome
} from '../../models';

/**
 * Sort direction type for the data table columns.
 */
type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort state for a specific column.
 */
interface SortState {
  readonly column: string;
  readonly direction: SortDirection;
}

/**
 * ComplianceChecklistComponent — Container page displaying all active compliance
 * requirements in a data table with status indicators, filtering, sorting, and a summary bar.
 *
 * Responsibilities:
 * - Dispatches ComplianceRequirementActions.loadChecklist on init
 * - Renders data table: Name, Category, Frequency, Last Check Date, Last Outcome, Next Due Date, Status
 * - Summary bar: total, compliant, overdue, due soon
 * - Filtering by Category, Status (color), Frequency, ResponsibleRole
 * - Sorting by Name, Category, Next Due Date, Last Outcome
 * - Click navigates to requirement detail page
 *
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6
 */
@Component({
  selector: 'app-compliance-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule, ComplianceStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Compliance Checklist</h1>
          <p class="text-sm text-base-content/60">
            View all active compliance requirements, their current status, and upcoming due dates.
            Identify gaps and prioritise checks at a glance.
          </p>
        </div>
      </div>

      <!-- Summary Bar (Requirement 20.6) -->
      <div
        class="grid grid-cols-2 sm:grid-cols-4 gap-4"
        role="region"
        aria-label="Compliance checklist summary"
      >
        <div class="stat bg-base-200 rounded-lg p-4">
          <div class="stat-title text-xs">Total Requirements</div>
          <div class="stat-value text-xl">{{ summaryTotal }}</div>
        </div>
        <div class="stat bg-success/10 rounded-lg p-4">
          <div class="stat-title text-xs text-success">Compliant</div>
          <div class="stat-value text-xl text-success">{{ summaryCompliant }}</div>
        </div>
        <div class="stat bg-error/10 rounded-lg p-4">
          <div class="stat-title text-xs text-error">Overdue</div>
          <div class="stat-value text-xl text-error">{{ summaryOverdue }}</div>
        </div>
        <div class="stat bg-warning/10 rounded-lg p-4">
          <div class="stat-title text-xs text-warning">Due Soon</div>
          <div class="stat-value text-xl text-warning">{{ summaryDueSoon }}</div>
        </div>
      </div>

      <!-- Filtering Controls (Requirement 20.3) -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end flex-wrap">
        <!-- Category Filter -->
        <div class="form-control w-full sm:w-48">
          <label class="label py-1" for="categoryFilter">
            <span class="label-text text-xs font-medium">Category</span>
          </label>
          <select
            id="categoryFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedCategory"
            (ngModelChange)="onCategoryChange($event)"
            aria-label="Filter by compliance category"
          >
            <option [ngValue]="undefined">All Categories</option>
            @for (cat of categoryOptions; track cat.value) {
              <option [ngValue]="cat.value">{{ cat.label }}</option>
            }
          </select>
        </div>

        <!-- Status Filter -->
        <div class="form-control w-full sm:w-44">
          <label class="label py-1" for="statusColorFilter">
            <span class="label-text text-xs font-medium">Status</span>
          </label>
          <select
            id="statusColorFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedStatusColor"
            (ngModelChange)="onStatusColorChange($event)"
            aria-label="Filter by compliance status"
          >
            <option [ngValue]="undefined">All Statuses</option>
            @for (status of statusColorOptions; track status.value) {
              <option [ngValue]="status.value">{{ status.label }}</option>
            }
          </select>
        </div>

        <!-- Frequency Filter -->
        <div class="form-control w-full sm:w-44">
          <label class="label py-1" for="frequencyFilter">
            <span class="label-text text-xs font-medium">Frequency</span>
          </label>
          <select
            id="frequencyFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedFrequency"
            (ngModelChange)="onFrequencyChange($event)"
            aria-label="Filter by check frequency"
          >
            <option [ngValue]="undefined">All Frequencies</option>
            @for (freq of frequencyOptions; track freq.value) {
              <option [ngValue]="freq.value">{{ freq.label }}</option>
            }
          </select>
        </div>

        <!-- Responsible Role Filter -->
        <div class="form-control w-full sm:w-52">
          <label class="label py-1" for="roleFilter">
            <span class="label-text text-xs font-medium">Responsible Role</span>
          </label>
          <select
            id="roleFilter"
            class="select select-bordered select-sm w-full"
            [ngModel]="selectedRole"
            (ngModelChange)="onRoleChange($event)"
            aria-label="Filter by responsible role"
          >
            <option [ngValue]="undefined">All Roles</option>
            @for (role of availableRoles; track role) {
              <option [ngValue]="role">{{ role }}</option>
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
          <h2 class="text-lg font-semibold text-base-content mb-1">Unable to Load Compliance Checklist</h2>
          <p class="text-sm text-base-content/60 mb-4 text-center max-w-md">
            {{ error }}
          </p>
          <button
            class="btn btn-error btn-sm"
            (click)="onRetry()"
            aria-label="Retry loading compliance checklist"
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
        <div class="overflow-x-auto" role="status" aria-label="Loading compliance checklist data">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Frequency</th>
                <th>Last Check Date</th>
                <th>Last Outcome</th>
                <th>Next Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (row of skeletonRows; track row) {
                <tr class="animate-pulse">
                  <td><div class="h-3 w-36 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-28 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-20 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-4 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-24 bg-base-300 rounded"></div></td>
                  <td><div class="h-3 w-6 bg-base-300 rounded-full"></div></td>
                </tr>
              }
            </tbody>
          </table>
          <span class="sr-only">Loading compliance checklist, please wait...</span>
        </div>
      </ng-container>

      <!-- Data Table (Requirement 20.1) -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <!-- Empty State -->
        <ng-container *ngIf="filteredItems.length === 0">
          <div
            class="flex flex-col items-center justify-center p-12 rounded-xl border border-base-300 bg-base-100"
            role="status"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h2 class="text-lg font-semibold text-base-content mb-1">No Requirements Found</h2>
            <p class="text-sm text-base-content/60 text-center max-w-md">
              {{ hasActiveFilters() ? 'No compliance requirements match your current filters. Try adjusting or clearing your filters.' : 'No active compliance requirements have been defined yet.' }}
            </p>
            <button
              *ngIf="hasActiveFilters()"
              class="btn btn-ghost btn-sm mt-4"
              (click)="onClearFilters()"
            >
              Clear Filters
            </button>
          </div>
        </ng-container>

        <!-- Table -->
        <div *ngIf="filteredItems.length > 0" class="overflow-x-auto">
          <table
            class="table table-sm table-zebra w-full"
            role="grid"
            aria-label="Compliance requirements checklist"
          >
            <thead>
              <tr>
                <th
                  class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                  (click)="onSort('name')"
                  (keydown.enter)="onSort('name')"
                  tabindex="0"
                  role="columnheader"
                  [attr.aria-sort]="getAriaSort('name')"
                >
                  <span class="inline-flex items-center gap-1">
                    Name
                    <ng-container *ngIf="sortState.column === 'name'">
                      <span *ngIf="sortState.direction === 'asc'" aria-hidden="true">▲</span>
                      <span *ngIf="sortState.direction === 'desc'" aria-hidden="true">▼</span>
                    </ng-container>
                  </span>
                </th>
                <th
                  class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                  (click)="onSort('category')"
                  (keydown.enter)="onSort('category')"
                  tabindex="0"
                  role="columnheader"
                  [attr.aria-sort]="getAriaSort('category')"
                >
                  <span class="inline-flex items-center gap-1">
                    Category
                    <ng-container *ngIf="sortState.column === 'category'">
                      <span *ngIf="sortState.direction === 'asc'" aria-hidden="true">▲</span>
                      <span *ngIf="sortState.direction === 'desc'" aria-hidden="true">▼</span>
                    </ng-container>
                  </span>
                </th>
                <th>Frequency</th>
                <th>Last Check Date</th>
                <th
                  class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                  (click)="onSort('lastCheckOutcome')"
                  (keydown.enter)="onSort('lastCheckOutcome')"
                  tabindex="0"
                  role="columnheader"
                  [attr.aria-sort]="getAriaSort('lastCheckOutcome')"
                >
                  <span class="inline-flex items-center gap-1">
                    Last Outcome
                    <ng-container *ngIf="sortState.column === 'lastCheckOutcome'">
                      <span *ngIf="sortState.direction === 'asc'" aria-hidden="true">▲</span>
                      <span *ngIf="sortState.direction === 'desc'" aria-hidden="true">▼</span>
                    </ng-container>
                  </span>
                </th>
                <th
                  class="cursor-pointer select-none hover:bg-base-200 transition-colors"
                  (click)="onSort('nextDueDate')"
                  (keydown.enter)="onSort('nextDueDate')"
                  tabindex="0"
                  role="columnheader"
                  [attr.aria-sort]="getAriaSort('nextDueDate')"
                >
                  <span class="inline-flex items-center gap-1">
                    Next Due Date
                    <ng-container *ngIf="sortState.column === 'nextDueDate'">
                      <span *ngIf="sortState.direction === 'asc'" aria-hidden="true">▲</span>
                      <span *ngIf="sortState.direction === 'desc'" aria-hidden="true">▼</span>
                    </ng-container>
                  </span>
                </th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredItems; track item.id) {
                <tr
                  class="cursor-pointer hover:bg-base-200/50 transition-colors"
                  (click)="onRowClick(item)"
                  (keydown.enter)="onRowClick(item)"
                  tabindex="0"
                  role="row"
                  [attr.aria-label]="'View details for ' + item.name"
                >
                  <td class="font-medium text-base-content">{{ item.name }}</td>
                  <td>
                    <span class="badge badge-outline badge-sm">{{ formatCategory(item.category) }}</span>
                  </td>
                  <td class="text-base-content/70">{{ formatFrequency(item.frequency) }}</td>
                  <td class="text-base-content/70">{{ item.lastCheckDate ? formatDate(item.lastCheckDate) : '—' }}</td>
                  <td>
                    <span
                      *ngIf="item.lastCheckOutcome"
                      class="badge badge-sm"
                      [ngClass]="getOutcomeBadgeClass(item.lastCheckOutcome)"
                    >
                      {{ formatOutcome(item.lastCheckOutcome) }}
                    </span>
                    <span *ngIf="!item.lastCheckOutcome" class="text-base-content/40">—</span>
                  </td>
                  <td class="text-base-content/70">{{ item.nextDueDate ? formatDate(item.nextDueDate) : '—' }}</td>
                  <td>
                    <app-compliance-status-badge
                      [statusColor]="item.statusColor"
                      [showLabel]="true"
                    />
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </ng-container>
    </div>
  `
})
export class ComplianceChecklistComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  /** Observable of checklist loading state. */
  readonly loading$: Observable<boolean> = this.store.select(selectChecklistLoading);

  /** Observable of error state. */
  readonly error$: Observable<string | null> = this.store.select(selectRequirementsError);

  /** All checklist items from the store (color-coded). */
  private allItems: readonly IColorCodedChecklistItem[] = [];

  /** Filtered and sorted items for display. */
  filteredItems: readonly IColorCodedChecklistItem[] = [];

  /** Summary counts. */
  summaryTotal = 0;
  summaryCompliant = 0;
  summaryOverdue = 0;
  summaryDueSoon = 0;

  /** Current sort state. */
  sortState: SortState = { column: 'name', direction: 'asc' };

  /** Filter state. */
  selectedCategory: ComplianceCategory | undefined = undefined;
  selectedStatusColor: ComplianceStatusColor | undefined = undefined;
  selectedFrequency: ComplianceFrequency | undefined = undefined;
  selectedRole: string | undefined = undefined;

  /** Available roles extracted from checklist data. */
  availableRoles: readonly string[] = [];

  /** Skeleton rows for loading state. */
  readonly skeletonRows = Array.from({ length: 8 }, (_, i) => i);

  /** Category filter dropdown options. */
  readonly categoryOptions: readonly FilterOption<ComplianceCategory>[] = [
    { value: ComplianceCategory.HealthAndSafety, label: 'Health & Safety' },
    { value: ComplianceCategory.Environmental, label: 'Environmental' },
    { value: ComplianceCategory.Financial, label: 'Financial' },
    { value: ComplianceCategory.DataProtection, label: 'Data Protection' },
    { value: ComplianceCategory.BuildingRegulations, label: 'Building Regulations' },
    { value: ComplianceCategory.PlanningCompliance, label: 'Planning Compliance' },
    { value: ComplianceCategory.AntiMoneyLaundering, label: 'Anti Money Laundering' },
    { value: ComplianceCategory.Employment, label: 'Employment' }
  ];

  /** Status color filter dropdown options. */
  readonly statusColorOptions: readonly FilterOption<ComplianceStatusColor>[] = [
    { value: 'green', label: 'Compliant' },
    { value: 'amber', label: 'Due Soon' },
    { value: 'red', label: 'Overdue' },
    { value: 'grey', label: 'Not Yet Checked' }
  ];

  /** Frequency filter dropdown options. */
  readonly frequencyOptions: readonly FilterOption<ComplianceFrequency>[] = [
    { value: ComplianceFrequency.OneOff, label: 'One-Off' },
    { value: ComplianceFrequency.Daily, label: 'Daily' },
    { value: ComplianceFrequency.Weekly, label: 'Weekly' },
    { value: ComplianceFrequency.Monthly, label: 'Monthly' },
    { value: ComplianceFrequency.Quarterly, label: 'Quarterly' },
    { value: ComplianceFrequency.Annually, label: 'Annually' },
    { value: ComplianceFrequency.Ongoing, label: 'Ongoing' }
  ];

  ngOnInit(): void {
    this.store.dispatch(ComplianceRequirementActions.loadChecklist());

    this.store.select(selectColorCodedChecklist).pipe(
      takeUntil(this.destroy$)
    ).subscribe((items) => {
      this.allItems = items;
      this.extractAvailableRoles(items);
      this.computeSummary(items);
      this.applyFiltersAndSort();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ──────────────────────────────────────────────
  // Filter Handlers
  // ──────────────────────────────────────────────

  /** Handles category filter change. */
  onCategoryChange(category: ComplianceCategory | undefined): void {
    this.selectedCategory = category;
    this.applyFiltersAndSort();
  }

  /** Handles status color filter change. */
  onStatusColorChange(statusColor: ComplianceStatusColor | undefined): void {
    this.selectedStatusColor = statusColor;
    this.applyFiltersAndSort();
  }

  /** Handles frequency filter change. */
  onFrequencyChange(frequency: ComplianceFrequency | undefined): void {
    this.selectedFrequency = frequency;
    this.applyFiltersAndSort();
  }

  /** Handles responsible role filter change. */
  onRoleChange(role: string | undefined): void {
    this.selectedRole = role;
    this.applyFiltersAndSort();
  }

  /** Clears all active filters. */
  onClearFilters(): void {
    this.selectedCategory = undefined;
    this.selectedStatusColor = undefined;
    this.selectedFrequency = undefined;
    this.selectedRole = undefined;
    this.applyFiltersAndSort();
  }

  /** Returns true if any filter is actively applied. */
  hasActiveFilters(): boolean {
    return this.selectedCategory !== undefined ||
      this.selectedStatusColor !== undefined ||
      this.selectedFrequency !== undefined ||
      this.selectedRole !== undefined;
  }

  // ──────────────────────────────────────────────
  // Sorting
  // ──────────────────────────────────────────────

  /** Handles sort column click (Requirement 20.4). */
  onSort(column: string): void {
    if (this.sortState.column === column) {
      // Cycle: asc → desc → null → asc
      if (this.sortState.direction === 'asc') {
        this.sortState = { column, direction: 'desc' };
      } else if (this.sortState.direction === 'desc') {
        this.sortState = { column, direction: null };
      } else {
        this.sortState = { column, direction: 'asc' };
      }
    } else {
      this.sortState = { column, direction: 'asc' };
    }
    this.applyFiltersAndSort();
  }

  /** Returns aria-sort value for a column header. */
  getAriaSort(column: string): string {
    if (this.sortState.column !== column || this.sortState.direction === null) {
      return 'none';
    }
    return this.sortState.direction === 'asc' ? 'ascending' : 'descending';
  }

  // ──────────────────────────────────────────────
  // Navigation (Requirement 20.5)
  // ──────────────────────────────────────────────

  /** Navigates to requirement detail page on row click. */
  onRowClick(item: IColorCodedChecklistItem): void {
    this.router.navigate(['/legal-compliance', 'compliance', item.id]);
  }

  /** Retries loading checklist data. */
  onRetry(): void {
    this.store.dispatch(ComplianceRequirementActions.loadChecklist());
  }

  // ──────────────────────────────────────────────
  // Formatters
  // ──────────────────────────────────────────────

  /** Formats category enum to display label. */
  formatCategory(category: ComplianceCategory): string {
    const map: Record<ComplianceCategory, string> = {
      [ComplianceCategory.HealthAndSafety]: 'Health & Safety',
      [ComplianceCategory.Environmental]: 'Environmental',
      [ComplianceCategory.Financial]: 'Financial',
      [ComplianceCategory.DataProtection]: 'Data Protection',
      [ComplianceCategory.BuildingRegulations]: 'Building Regulations',
      [ComplianceCategory.PlanningCompliance]: 'Planning Compliance',
      [ComplianceCategory.AntiMoneyLaundering]: 'Anti Money Laundering',
      [ComplianceCategory.Employment]: 'Employment'
    };
    return map[category] ?? category;
  }

  /** Formats frequency enum to display label. */
  formatFrequency(frequency: ComplianceFrequency): string {
    const map: Record<ComplianceFrequency, string> = {
      [ComplianceFrequency.OneOff]: 'One-Off',
      [ComplianceFrequency.Daily]: 'Daily',
      [ComplianceFrequency.Weekly]: 'Weekly',
      [ComplianceFrequency.Monthly]: 'Monthly',
      [ComplianceFrequency.Quarterly]: 'Quarterly',
      [ComplianceFrequency.Annually]: 'Annually',
      [ComplianceFrequency.Ongoing]: 'Ongoing'
    };
    return map[frequency] ?? frequency;
  }

  /** Formats a date string to a locale-friendly display. */
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** Formats outcome enum to display label. */
  formatOutcome(outcome: ComplianceCheckOutcome): string {
    const map: Record<ComplianceCheckOutcome, string> = {
      [ComplianceCheckOutcome.Compliant]: 'Compliant',
      [ComplianceCheckOutcome.NonCompliant]: 'Non-Compliant',
      [ComplianceCheckOutcome.PartiallyCompliant]: 'Partial',
      [ComplianceCheckOutcome.NotApplicable]: 'N/A'
    };
    return map[outcome] ?? outcome;
  }

  /** Returns badge CSS class for outcome display. */
  getOutcomeBadgeClass(outcome: ComplianceCheckOutcome): string {
    switch (outcome) {
      case ComplianceCheckOutcome.Compliant:
        return 'badge-success';
      case ComplianceCheckOutcome.NonCompliant:
        return 'badge-error';
      case ComplianceCheckOutcome.PartiallyCompliant:
        return 'badge-warning';
      case ComplianceCheckOutcome.NotApplicable:
      default:
        return 'badge-ghost';
    }
  }

  // ──────────────────────────────────────────────
  // Private Helpers
  // ──────────────────────────────────────────────

  /**
   * Extracts unique responsible roles from the checklist data
   * for the role filter dropdown.
   */
  private extractAvailableRoles(items: readonly IColorCodedChecklistItem[]): void {
    const roles = new Set<string>();
    for (const item of items) {
      if (item.responsibleRole) {
        roles.add(item.responsibleRole);
      }
    }
    this.availableRoles = Array.from(roles).sort();
  }

  /**
   * Computes summary bar counts from all (unfiltered) items (Requirement 20.6).
   */
  private computeSummary(items: readonly IColorCodedChecklistItem[]): void {
    this.summaryTotal = items.length;
    this.summaryCompliant = items.filter((i) => i.statusColor === 'green').length;
    this.summaryOverdue = items.filter((i) => i.statusColor === 'red').length;
    this.summaryDueSoon = items.filter((i) => i.statusColor === 'amber').length;
  }

  /**
   * Applies current filters and sort state to produce the filtered display list.
   */
  private applyFiltersAndSort(): void {
    let items = [...this.allItems];

    // Apply filters
    if (this.selectedCategory !== undefined) {
      items = items.filter((i) => i.category === this.selectedCategory);
    }
    if (this.selectedStatusColor !== undefined) {
      items = items.filter((i) => i.statusColor === this.selectedStatusColor);
    }
    if (this.selectedFrequency !== undefined) {
      items = items.filter((i) => i.frequency === this.selectedFrequency);
    }
    if (this.selectedRole !== undefined) {
      items = items.filter((i) => i.responsibleRole === this.selectedRole);
    }

    // Apply sort
    if (this.sortState.direction !== null) {
      items = this.sortItems(items, this.sortState.column, this.sortState.direction);
    }

    this.filteredItems = items;
  }

  /**
   * Sorts items by the given column and direction.
   */
  private sortItems(
    items: IColorCodedChecklistItem[],
    column: string,
    direction: 'asc' | 'desc'
  ): IColorCodedChecklistItem[] {
    const multiplier = direction === 'asc' ? 1 : -1;

    return items.sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = this.formatCategory(a.category).localeCompare(this.formatCategory(b.category));
          break;
        case 'nextDueDate': {
          const dateA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
          const dateB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Number.MAX_SAFE_INTEGER;
          comparison = dateA - dateB;
          break;
        }
        case 'lastCheckOutcome': {
          const outcomeOrder: Record<string, number> = {
            [ComplianceCheckOutcome.Compliant]: 0,
            [ComplianceCheckOutcome.PartiallyCompliant]: 1,
            [ComplianceCheckOutcome.NonCompliant]: 2,
            [ComplianceCheckOutcome.NotApplicable]: 3
          };
          const orderA = a.lastCheckOutcome ? (outcomeOrder[a.lastCheckOutcome] ?? 4) : 4;
          const orderB = b.lastCheckOutcome ? (outcomeOrder[b.lastCheckOutcome] ?? 4) : 4;
          comparison = orderA - orderB;
          break;
        }
        default:
          comparison = 0;
      }

      return comparison * multiplier;
    });
  }
}

/** Helper type for filter dropdown options. */
interface FilterOption<T> {
  readonly value: T;
  readonly label: string;
}
