import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IAdvancedFilters } from '../../models/search.model';

/**
 * AdvancedFiltersComponent provides controls for narrowing search results.
 * Includes: modules multi-select, statuses multi-select, date range (from/to),
 * created by text input, and tags multi-select.
 *
 * Validates that dateTo >= dateFrom before emitting filter changes.
 * Provides a "Clear all" button to reset all filters.
 *
 * Presentational component — receives data via input, emits events via output.
 */
@Component({
  selector: 'app-advanced-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-100 rounded-lg p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold text-base-content">Advanced Filters</h3>
        <button
          class="btn btn-ghost btn-xs text-base-content/60"
          aria-label="Clear all filters"
          (click)="onClearAll()"
        >
          <span class="material-symbols-outlined text-sm" aria-hidden="true">filter_list_off</span>
          Clear all
        </button>
      </div>

      <!-- Modules multi-select -->
      <div class="form-control w-full">
        <label class="label" for="modules-select">
          <span class="label-text text-xs">Modules</span>
        </label>
        <select
          id="modules-select"
          class="select select-bordered select-sm w-full"
          multiple
          [ngModel]="selectedModules()"
          (ngModelChange)="onModulesChange($event)"
          aria-label="Filter by modules"
        >
          @for (mod of availableModules; track mod) {
            <option [value]="mod">{{ mod }}</option>
          }
        </select>
      </div>

      <!-- Statuses multi-select -->
      <div class="form-control w-full">
        <label class="label" for="statuses-select">
          <span class="label-text text-xs">Statuses</span>
        </label>
        <select
          id="statuses-select"
          class="select select-bordered select-sm w-full"
          multiple
          [ngModel]="selectedStatuses()"
          (ngModelChange)="onStatusesChange($event)"
          aria-label="Filter by statuses"
        >
          @for (status of availableStatuses; track status) {
            <option [value]="status">{{ status }}</option>
          }
        </select>
      </div>

      <!-- Date range -->
      <div class="grid grid-cols-2 gap-3">
        <div class="form-control">
          <label class="label" for="date-from">
            <span class="label-text text-xs">Date from</span>
          </label>
          <input
            id="date-from"
            type="date"
            class="input input-bordered input-sm w-full"
            [ngModel]="dateFrom()"
            (ngModelChange)="onDateFromChange($event)"
            aria-label="Filter from date"
          />
        </div>
        <div class="form-control">
          <label class="label" for="date-to">
            <span class="label-text text-xs">Date to</span>
          </label>
          <input
            id="date-to"
            type="date"
            class="input input-bordered input-sm w-full"
            [ngModel]="dateTo()"
            (ngModelChange)="onDateToChange($event)"
            [class.input-error]="dateRangeInvalid()"
            aria-label="Filter to date"
            [attr.aria-invalid]="dateRangeInvalid()"
            [attr.aria-describedby]="dateRangeInvalid() ? 'date-error' : null"
          />
          @if (dateRangeInvalid()) {
            <label class="label" id="date-error">
              <span class="label-text-alt text-error">End date must be on or after start date</span>
            </label>
          }
        </div>
      </div>

      <!-- Created by -->
      <div class="form-control w-full">
        <label class="label" for="created-by">
          <span class="label-text text-xs">Created by</span>
        </label>
        <input
          id="created-by"
          type="text"
          class="input input-bordered input-sm w-full"
          placeholder="Username or email"
          [ngModel]="createdBy()"
          (ngModelChange)="onCreatedByChange($event)"
          aria-label="Filter by creator"
        />
      </div>

      <!-- Tags multi-select -->
      <div class="form-control w-full">
        <label class="label" for="tags-select">
          <span class="label-text text-xs">Tags</span>
        </label>
        <select
          id="tags-select"
          class="select select-bordered select-sm w-full"
          multiple
          [ngModel]="selectedTags()"
          (ngModelChange)="onTagsChange($event)"
          aria-label="Filter by tags"
        >
          @for (tag of availableTags; track tag) {
            <option [value]="tag">{{ tag }}</option>
          }
        </select>
      </div>
    </div>
  `
})
export class AdvancedFiltersComponent {
  /** Current filter values */
  readonly filters = input<IAdvancedFilters>({
    modules: [],
    statuses: [],
    dateFrom: null,
    dateTo: null,
    createdBy: null,
    tags: []
  });

  /** Available module options for multi-select */
  readonly availableModuleOptions = input<string[]>([]);

  /** Available status options for multi-select */
  readonly availableStatusOptions = input<string[]>([]);

  /** Available tag options for multi-select */
  readonly availableTagOptions = input<string[]>([]);

  /** Emits partial filter changes when user modifies a filter */
  readonly filtersChanged = output<Partial<IAdvancedFilters>>();

  /** Emits when user clicks "Clear all" */
  readonly clearFilters = output<void>();

  // Internal signals reflecting current filter state
  readonly selectedModules = signal<string[]>([]);
  readonly selectedStatuses = signal<string[]>([]);
  readonly dateFrom = signal<string | null>(null);
  readonly dateTo = signal<string | null>(null);
  readonly createdBy = signal<string | null>(null);
  readonly selectedTags = signal<string[]>([]);
  readonly dateRangeInvalid = signal<boolean>(false);

  /** Default available modules (used when no options provided) */
  readonly availableModules: string[] = [
    'Land Acquisition',
    'Planning',
    'Legal',
    'Users',
    'Documents',
    'Notifications'
  ];

  /** Default available statuses */
  readonly availableStatuses: string[] = [
    'Active',
    'Pending',
    'Completed',
    'Rejected',
    'Draft',
    'In Progress',
    'Archived'
  ];

  /** Default available tags */
  readonly availableTags: string[] = [
    'Urgent',
    'High Priority',
    'Review Required',
    'Compliance',
    'Financial'
  ];

  constructor() {
    // Sync input filters to internal signals
    effect(() => {
      const f = this.filters();
      this.selectedModules.set([...f.modules]);
      this.selectedStatuses.set([...f.statuses]);
      this.dateFrom.set(f.dateFrom);
      this.dateTo.set(f.dateTo);
      this.createdBy.set(f.createdBy);
      this.selectedTags.set([...f.tags]);
    });
  }

  onModulesChange(modules: string[]): void {
    this.selectedModules.set(modules);
    this.filtersChanged.emit({ modules });
  }

  onStatusesChange(statuses: string[]): void {
    this.selectedStatuses.set(statuses);
    this.filtersChanged.emit({ statuses });
  }

  onDateFromChange(dateFrom: string): void {
    const value = dateFrom || null;
    this.dateFrom.set(value);
    this.validateDateRange();
    if (!this.dateRangeInvalid()) {
      this.filtersChanged.emit({ dateFrom: value });
    }
  }

  onDateToChange(dateTo: string): void {
    const value = dateTo || null;
    this.dateTo.set(value);
    this.validateDateRange();
    if (!this.dateRangeInvalid()) {
      this.filtersChanged.emit({ dateTo: value });
    }
  }

  onCreatedByChange(createdBy: string): void {
    const value = createdBy || null;
    this.createdBy.set(value);
    this.filtersChanged.emit({ createdBy: value });
  }

  onTagsChange(tags: string[]): void {
    this.selectedTags.set(tags);
    this.filtersChanged.emit({ tags });
  }

  onClearAll(): void {
    this.selectedModules.set([]);
    this.selectedStatuses.set([]);
    this.dateFrom.set(null);
    this.dateTo.set(null);
    this.createdBy.set(null);
    this.selectedTags.set([]);
    this.dateRangeInvalid.set(false);
    this.clearFilters.emit();
  }

  /**
   * Validate that dateTo >= dateFrom. Prevents emitting invalid ranges.
   */
  private validateDateRange(): void {
    const from = this.dateFrom();
    const to = this.dateTo();
    if (from && to) {
      this.dateRangeInvalid.set(new Date(to) < new Date(from));
    } else {
      this.dateRangeInvalid.set(false);
    }
  }
}
