import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { DataGridComponent, IGridColumn, IFilterOption } from '../../../../shared/components';
import { OpportunityService, IOpportunityQueryParams } from '../../services/opportunity.service';
import { OpportunityStatus } from '../../models';

/**
 * Container component displaying the opportunities list using the reusable DataGrid.
 *
 * Fetches paginated opportunity data from the API and renders it in a
 * sortable, searchable, filterable data grid with navigation to detail pages.
 */
@Component({
  selector: 'app-opportunity-list-page',
  standalone: true,
  imports: [CommonModule, DataGridComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Opportunities</h1>
          <p class="text-sm text-base-content/60">
            Manage and track all land acquisition opportunities in your pipeline.
          </p>
        </div>
        <button
          class="btn btn-primary btn-sm gap-2"
          (click)="navigateToCreate()">
          <span class="material-symbols-outlined text-lg">add</span>
          Create Opportunity
        </button>
      </div>

      <!-- Data Grid -->
      <app-data-grid
        title="Land Opportunities"
        [data]="opportunities"
        [columns]="columns"
        [loading]="loading"
        [totalCount]="totalCount"
        [pageSize]="pageSize"
        [currentPage]="currentPage"
        [filterOptions]="statusFilters"
        filterLabel="Status"
        searchPlaceholder="Search opportunities..."
        emptyIcon="terrain"
        emptyMessage="No opportunities found"
        emptySubtext="Create your first opportunity to begin evaluating development sites."
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
export class OpportunityListPageComponent implements OnInit {
  private readonly opportunityService = inject(OpportunityService);
  private readonly router = inject(Router);

  opportunities: Record<string, unknown>[] = [];
  loading = true;
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;

  private searchTerm = '';
  private statusFilter: OpportunityStatus | undefined;
  private sortBy: string | undefined;
  private sortDirection: 'asc' | 'desc' | undefined;

  /** Column definitions for the opportunity data grid. */
  readonly columns: IGridColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'landSize', label: 'Land Size (acres)', sortable: true, type: 'number' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      type: 'badge',
      badgeMap: {
        [OpportunityStatus.Identified]: 'badge-ghost',
        [OpportunityStatus.InitialReview]: 'badge-info',
        [OpportunityStatus.DueDiligence]: 'badge-warning',
        [OpportunityStatus.OfferMade]: 'badge-primary',
        [OpportunityStatus.UnderContract]: 'badge-secondary',
        [OpportunityStatus.Acquired]: 'badge-success',
        [OpportunityStatus.Withdrawn]: 'badge-error'
      }
    },
    { key: 'source', label: 'Source', sortable: true },
    { key: 'expectedAcquisition', label: 'Expected Date', sortable: true, type: 'date' },
    { key: 'createdAt', label: 'Created', sortable: true, type: 'date' }
  ];

  /** Filter options for the status dropdown. */
  readonly statusFilters: IFilterOption[] = [
    { value: OpportunityStatus.Identified, label: 'Identified' },
    { value: OpportunityStatus.InitialReview, label: 'Initial Review' },
    { value: OpportunityStatus.DueDiligence, label: 'Due Diligence' },
    { value: OpportunityStatus.OfferMade, label: 'Offer Made' },
    { value: OpportunityStatus.UnderContract, label: 'Under Contract' },
    { value: OpportunityStatus.Acquired, label: 'Acquired' },
    { value: OpportunityStatus.Withdrawn, label: 'Withdrawn' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  onRowClick(row: Record<string, unknown>): void {
    this.router.navigate(['/land-acquisition/opportunities', row['id']]);
  }

  onEditClick(row: Record<string, unknown>): void {
    this.router.navigate(['/land-acquisition/opportunities', row['id'], 'edit']);
  }

  onDeleteClick(row: Record<string, unknown>): void {
    if (confirm(`Are you sure you want to delete "${row['name']}"? This action cannot be undone.`)) {
      this.opportunityService.delete(row['id'] as string).subscribe({
        next: () => this.loadData(),
        error: () => alert('Failed to delete opportunity. Please try again.')
      });
    }
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
    this.statusFilter = value ? value as OpportunityStatus : undefined;
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
    this.router.navigate(['/land-acquisition/opportunities/new']);
  }

  private loadData(): void {
    this.loading = true;

    const params: IOpportunityQueryParams = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      search: this.searchTerm || undefined,
      status: this.statusFilter,
      sortBy: this.sortBy,
      sortDirection: this.sortDirection
    };

    this.opportunityService.getAll(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.opportunities = response.data as unknown as Record<string, unknown>[];
          this.totalCount = response.pagination?.totalCount ?? response.data.length;
        } else {
          this.opportunities = [];
          this.totalCount = 0;
        }
        this.loading = false;
      },
      error: () => {
        this.opportunities = [];
        this.totalCount = 0;
        this.loading = false;
      }
    });
  }
}
