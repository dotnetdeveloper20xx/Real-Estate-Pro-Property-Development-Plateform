import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IPlanningCondition } from '../../models/planning-condition.model';

/**
 * ConditionListComponent — A presentational component that displays planning conditions
 * in a DaisyUI data table with status/type badges and filtering capabilities.
 *
 * Columns: ConditionNumber, Description, Type (badge), Status (badge), DueDate, DischargeDate.
 * Supports filtering by Status and ConditionType.
 *
 * Requirements: 15.2
 *
 * @example
 * ```html
 * <app-condition-list
 *   [conditions]="conditions"
 *   (conditionSelect)="onConditionSelect($event)">
 * </app-condition-list>
 * ```
 */
@Component({
  selector: 'app-condition-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <select
        class="select select-bordered select-sm"
        [(ngModel)]="filterStatus"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="Outstanding">Outstanding</option>
        <option value="SubmittedForDischarge">Submitted for Discharge</option>
        <option value="Discharged">Discharged</option>
        <option value="Rejected">Rejected</option>
      </select>

      <select
        class="select select-bordered select-sm"
        [(ngModel)]="filterType"
        aria-label="Filter by condition type"
      >
        <option value="">All Types</option>
        <option value="PreCommencement">Pre-Commencement</option>
        <option value="PreOccupation">Pre-Occupation</option>
        <option value="DuringConstruction">During Construction</option>
        <option value="Compliance">Compliance</option>
      </select>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto" role="region" aria-label="Conditions table">
      <table class="table table-sm w-full" *ngIf="filteredConditions.length > 0; else emptyState">
        <thead>
          <tr>
            <th class="w-16">#</th>
            <th>Description</th>
            <th>Type</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Discharge Date</th>
          </tr>
        </thead>
        <tbody>
          <tr
            *ngFor="let condition of filteredConditions; trackBy: trackById"
            class="hover cursor-pointer"
            (click)="conditionSelect.emit(condition)"
            (keydown.enter)="conditionSelect.emit(condition)"
            tabindex="0"
            [attr.aria-label]="'Condition ' + condition.conditionNumber + ': ' + condition.description"
          >
            <td class="font-mono text-sm">{{ condition.conditionNumber }}</td>
            <td class="max-w-xs truncate" [title]="condition.description">
              {{ condition.description }}
            </td>
            <td>
              <span class="badge badge-sm" [ngClass]="getTypeBadgeClass(condition.conditionType)">
                {{ formatType(condition.conditionType) }}
              </span>
            </td>
            <td>
              <span class="badge badge-sm" [ngClass]="getStatusBadgeClass(condition.status)">
                {{ formatStatus(condition.status) }}
              </span>
            </td>
            <td class="text-sm">
              {{ condition.dueDate | date:'dd MMM yyyy' }}
              <span
                *ngIf="isOverdue(condition)"
                class="ml-1 text-error text-xs font-semibold"
                aria-label="Overdue"
              >
                Overdue
              </span>
            </td>
            <td class="text-sm">
              {{ condition.dischargeDate | date:'dd MMM yyyy' }}
            </td>
          </tr>
        </tbody>
      </table>

      <ng-template #emptyState>
        <div class="text-center py-8 text-base-content/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="font-medium">No conditions found</p>
          <p class="text-sm mt-1">
            {{ hasFilters ? 'Try adjusting your filters.' : 'Conditions will appear here when added.' }}
          </p>
        </div>
      </ng-template>
    </div>
  `
})
export class ConditionListComponent {
  /** Array of planning conditions to display. */
  @Input({ required: true }) conditions: readonly IPlanningCondition[] = [];

  /** Emits when a condition row is clicked for detail view. */
  @Output() conditionSelect = new EventEmitter<IPlanningCondition>();

  /** Current status filter value. */
  filterStatus = '';

  /** Current condition type filter value. */
  filterType = '';

  /** Returns conditions filtered by current filter selections. */
  get filteredConditions(): readonly IPlanningCondition[] {
    return this.conditions.filter(c => {
      const matchesStatus = !this.filterStatus || c.status === this.filterStatus;
      const matchesType = !this.filterType || c.conditionType === this.filterType;
      return matchesStatus && matchesType;
    });
  }

  /** Indicates whether any filter is currently active. */
  get hasFilters(): boolean {
    return !!this.filterStatus || !!this.filterType;
  }

  /** Returns the DaisyUI badge class for a condition type. */
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'PreCommencement':
        return 'badge-primary';
      case 'PreOccupation':
        return 'badge-secondary';
      case 'DuringConstruction':
        return 'badge-accent';
      case 'Compliance':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  }

  /** Returns the DaisyUI badge class for a condition status. */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Outstanding':
        return 'badge-warning';
      case 'SubmittedForDischarge':
        return 'badge-info';
      case 'Discharged':
        return 'badge-success';
      case 'Rejected':
        return 'badge-error';
      default:
        return 'badge-ghost';
    }
  }

  /** Formats PascalCase type value into a readable label. */
  formatType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .replace('Pre Commencement', 'Pre-Commencement')
      .replace('Pre Occupation', 'Pre-Occupation');
  }

  /** Formats PascalCase status value into a readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** Checks if a condition is overdue (due date is past and status is Outstanding). */
  isOverdue(condition: IPlanningCondition): boolean {
    if (!condition.dueDate || condition.status !== 'Outstanding') {
      return false;
    }
    return new Date(condition.dueDate) < new Date();
  }

  /** TrackBy function for ngFor. */
  trackById(_index: number, item: IPlanningCondition): string {
    return item.id;
  }
}
