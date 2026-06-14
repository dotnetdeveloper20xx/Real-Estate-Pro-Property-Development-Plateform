import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { DataGridComponent, IGridColumn, IFilterOption } from '../../../../shared/components';
import { PlanningApplicationService, IApplicationQueryParams } from '../../services/planning-application.service';
import { PlanningApplicationStatus, PlanningApplicationType } from '../../models';

/**
 * Container component displaying the planning applications list using the reusable DataGrid.
 *
 * Fetches paginated application data from the API and renders it in a
 * sortable, searchable, filterable data grid with navigation to detail pages.
 */
@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Planning Applications</h1>
          <p class="text-sm text-base-content/60">
            Track and manage all planning applications submitted to local councils.
          </p>
        </div>
        <button
          class="btn btn-primary btn-sm gap-2"
          (click)="navigateToCreate()">
          <span class="material-symbols-outlined text-lg">add</span>
          New Application
        </button>
      </div>

      <!-- Data Grid -->
      <app-data-grid
        title="Applications Register"
        [data]="applications"
        [columns]="columns"
        [loading]="loading"
        [totalCount]="totalCount"
        [pageSize]="pageSize"
        [currentPage]="currentPage"
        [filterOptions]="statusFilters"
        filterLabel="Status"
        searchPlaceholder="Search applications..."
        emptyIcon="assignment"
        emptyMessage="No planning applications found"
        emptySubtext="Submit your first planning application to begin the approvals process."
        (rowClick)="onRowClick($event)"
        (editClick)="onEditClick($event)"
        (deleteClick)="onDeleteClick($event)"
        (pageChange)="onPageChange($event)"
        (searchChange)="onSearchChange($event)"
        (filterChange)="onFilterChange($event)"
        (sortChange)="onSortChange($event)"
        (pageSizeChange)="onPageSizeChange($event)">
      </app-data-grid>
    </div>
  `
})
export class ApplicationListComponent implements OnInit {
  private readonly applicationService = inject(PlanningApplicationService);
  private readonly router = inject(Router);

  applications: Record<string, unknown>[] = [];
  loading = true;
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;

  private searchTerm = '';
  private statusFilter: PlanningApplicationStatus | undefined;
  private sortBy: string | undefined;
  private sortDirection: 'asc' | 'desc' | undefined;

  /** Column definitions for the application data grid. */
  readonly columns: IGridColumn[] = [
    { key: 'applicationReference', label: 'Reference', sortable: true },
    { key: 'description', label: 'Description', sortable: true, width: '25%' },
    {
      key: 'applicationType',
      label: 'Type',
      sortable: true,
      type: 'badge',
      badgeMap: {
        [PlanningApplicationType.Full]: 'badge-primary',
        [PlanningApplicationType.Outline]: 'badge-info',
        [PlanningApplicationType.ReservedMatters]: 'badge-secondary',
        [PlanningApplicationType.Householder]: 'badge-ghost',
        [PlanningApplicationType.ListedBuilding]: 'badge-warning',
        [PlanningApplicationType.ChangeOfUse]: 'badge-accent'
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      type: 'badge',
      badgeMap: {
        [PlanningApplicationStatus.PreApplication]: 'badge-ghost',
        [PlanningApplicationStatus.Submitted]: 'badge-info',
        [PlanningApplicationStatus.Validated]: 'badge-info',
        [PlanningApplicationStatus.UnderReview]: 'badge-warning',
        [PlanningApplicationStatus.CommitteeReview]: 'badge-warning',
        [PlanningApplicationStatus.Approved]: 'badge-success',
        [PlanningApplicationStatus.ApprovedWithConditions]: 'badge-success',
        [PlanningApplicationStatus.Refused]: 'badge-error',
        [PlanningApplicationStatus.Appeal]: 'badge-secondary',
        [PlanningApplicationStatus.Withdrawn]: 'badge-ghost'
      }
    },
    { key: 'councilName', label: 'Council', sortable: true },
    { key: 'submissionDate', label: 'Submitted', sortable: true, type: 'date' }
  ];

  /** Filter options for the status dropdown. */
  readonly statusFilters: IFilterOption[] = [
    { value: PlanningApplicationStatus.PreApplication, label: 'Pre-Application' },
    { value: PlanningApplicationStatus.Submitted, label: 'Submitted' },
    { value: PlanningApplicationStatus.Validated, label: 'Validated' },
    { value: PlanningApplicationStatus.UnderReview, label: 'Under Review' },
    { value: PlanningApplicationStatus.CommitteeReview, label: 'Committee Review' },
    { value: PlanningApplicationStatus.Approved, label: 'Approved' },
    { value: PlanningApplicationStatus.ApprovedWithConditions, label: 'Approved with Conditions' },
    { value: PlanningApplicationStatus.Refused, label: 'Refused' },
    { value: PlanningApplicationStatus.Appeal, label: 'Appeal' },
    { value: PlanningApplicationStatus.Withdrawn, label: 'Withdrawn' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/planning-approvals/applications', row['id']]);
  }

  onEditClick(row: Record<string, unknown>): void {
    this.router.navigate(['/planning-approvals/applications', row['id'], 'edit']);
  }

  onDeleteClick(_row: Record<string, unknown>): void {
    // Planning applications typically cannot be deleted, only withdrawn
    alert('Planning applications cannot be deleted. Use the status transition to withdraw if needed.');
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.loadData();
  }

  onFilterChange(value: string): void {
    this.statusFilter = value ? value as PlanningApplicationStatus : undefined;
    this.currentPage = 1;
    this.loadData();
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadData();
  }

  navigateToCreate(): void {
    this.router.navigate(['/planning-approvals/applications/create']);
  }

  private loadData(): void {
    this.loading = true;

    const params: IApplicationQueryParams = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      status: this.statusFilter,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.applicationService.getAll(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.applications = response.data.items as unknown as Record<string, unknown>[];
          this.totalCount = response.data.totalCount;
        } else {
          this.applications = [];
          this.totalCount = 0;
        }
        this.loading = false;
      },
      error: () => {
        this.applications = [];
        this.totalCount = 0;
        this.loading = false;
      }
    });
  }
}
