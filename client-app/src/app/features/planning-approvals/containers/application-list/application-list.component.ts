import { Component, ChangeDetectionStrategy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { DataTableComponent, IColumnDefinition, ITableAction, IActionClickEvent } from '../../../../shared/design-system';
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
  imports: [CommonModule, DataTableComponent],
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

      <!-- Data Table -->
      <app-data-table
        [data]="applications"
        [columns]="columns"
        [loading]="loading"
        [totalCount]="totalCount"
        [pageSizeOptions]="[10, 25, 50]"
        [actions]="tableActions"
        searchPlaceholder="Search applications..."
        emptyIcon="assignment"
        emptyMessage="No planning applications found"
        emptySubtext="Submit your first planning application to begin the approvals process."
        (rowClick)="onRowClick($event)"
        (actionClick)="onActionClick($event)"
        (pageChange)="onTablePageChange($event)"
        (searchChange)="onSearchChange($event)"
        (sortChange)="onSortChange($event)">
      </app-data-table>
    </div>
  `
})
export class ApplicationListComponent implements OnInit {
  private readonly applicationService = inject(PlanningApplicationService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  applications: Record<string, unknown>[] = [];
  loading = true;
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;

  private searchTerm = '';
  private sortBy: string | undefined;
  private sortDirection: 'asc' | 'desc' | undefined;

  /** Column definitions for the application data table. */
  readonly columns: IColumnDefinition[] = [
    { key: 'applicationReference', label: 'Reference', sortable: true, type: 'text', visible: true },
    { key: 'description', label: 'Description', sortable: true, type: 'text', visible: true, width: '25%' },
    {
      key: 'applicationType',
      label: 'Type',
      sortable: true,
      type: 'badge',
      visible: true,
      badgeMap: {
        [PlanningApplicationType.Full]: { label: 'Full', cssClass: 'badge-primary' },
        [PlanningApplicationType.Outline]: { label: 'Outline', cssClass: 'badge-info' },
        [PlanningApplicationType.ReservedMatters]: { label: 'Reserved Matters', cssClass: 'badge-secondary' },
        [PlanningApplicationType.Householder]: { label: 'Householder', cssClass: 'badge-ghost' },
        [PlanningApplicationType.ListedBuilding]: { label: 'Listed Building', cssClass: 'badge-warning' },
        [PlanningApplicationType.ChangeOfUse]: { label: 'Change of Use', cssClass: 'badge-accent' }
      }
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      type: 'badge',
      visible: true,
      badgeMap: {
        [PlanningApplicationStatus.PreApplication]: { label: 'Pre-Application', cssClass: 'badge-ghost' },
        [PlanningApplicationStatus.Submitted]: { label: 'Submitted', cssClass: 'badge-info' },
        [PlanningApplicationStatus.Validated]: { label: 'Validated', cssClass: 'badge-info' },
        [PlanningApplicationStatus.UnderReview]: { label: 'Under Review', cssClass: 'badge-warning' },
        [PlanningApplicationStatus.CommitteeReview]: { label: 'Committee Review', cssClass: 'badge-warning' },
        [PlanningApplicationStatus.Approved]: { label: 'Approved', cssClass: 'badge-success' },
        [PlanningApplicationStatus.ApprovedWithConditions]: { label: 'Approved with Conditions', cssClass: 'badge-success' },
        [PlanningApplicationStatus.Refused]: { label: 'Refused', cssClass: 'badge-error' },
        [PlanningApplicationStatus.Appeal]: { label: 'Appeal', cssClass: 'badge-secondary' },
        [PlanningApplicationStatus.Withdrawn]: { label: 'Withdrawn', cssClass: 'badge-ghost' }
      }
    },
    { key: 'councilName', label: 'Council', sortable: true, type: 'text', visible: true },
    { key: 'submissionDate', label: 'Submitted', sortable: true, type: 'date', visible: true }
  ];

  /** Row actions for the data table. */
  readonly tableActions: ITableAction[] = [
    { label: 'View', icon: 'visibility', event: 'view' },
    { label: 'Edit', icon: 'edit', event: 'edit' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  onRowClick(row: unknown): void {
    const r = row as Record<string, unknown>;
    this.router.navigate(['/planning-approvals/applications', r['id']]);
  }

  onActionClick(event: IActionClickEvent): void {
    const row = event.row as Record<string, unknown>;
    switch (event.action) {
      case 'view':
        this.router.navigate(['/planning-approvals/applications', row['id']]);
        break;
      case 'edit':
        this.router.navigate(['/planning-approvals/applications', row['id'], 'edit']);
        break;
    }
  }

  onEditClick(row: Record<string, unknown>): void {
    this.router.navigate(['/planning-approvals/applications', row['id'], 'edit']);
  }

  onDeleteClick(_row: Record<string, unknown>): void {
    // Planning applications typically cannot be deleted, only withdrawn
    alert('Planning applications cannot be deleted. Use the status transition to withdraw if needed.');
  }

  onTablePageChange(event: { page: number; pageSize: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.pageSize;
    this.loadData();
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

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }): void {
    this.sortBy = event.column;
    this.sortDirection = event.direction;
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
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.applicationService.getAll(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // response.data is the items array (interceptor unwraps paginated responses)
          const items = Array.isArray(response.data) ? response.data : (response.data as any).items ?? [];
          this.applications = items as unknown as Record<string, unknown>[];
          this.totalCount = (response as any).pagination?.totalCount ?? items.length;
        } else {
          this.applications = [];
          this.totalCount = 0;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.applications = [];
        this.totalCount = 0;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
