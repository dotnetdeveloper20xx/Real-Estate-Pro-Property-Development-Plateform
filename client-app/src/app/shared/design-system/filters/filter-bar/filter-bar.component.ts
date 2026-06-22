import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

/** Supported filter types */
export type FilterType = 'text' | 'dropdown' | 'date-range' | 'status-chip' | 'tag';

/** Option for dropdown, status-chip, and tag filters */
export interface IFilterOption {
  value: string;
  label: string;
}

/** Definition for a single filter control */
export interface IFilterDefinition {
  key: string;
  type: FilterType;
  label: string;
  placeholder?: string;
  options?: IFilterOption[];
  multiSelect?: boolean;
  maxSelections?: number;
}

/** Saved filter preset */
export interface IFilterPreset {
  id: string;
  name: string;
  values: Record<string, unknown>;
}

/** Date range value */
export interface IDateRangeValue {
  start: string | null;
  end: string | null;
}

/** Maximum constants */
const MAX_FILTERS = 10;
const MAX_TEXT_LENGTH = 200;
const TEXT_DEBOUNCE_MS = 300;
const MAX_DROPDOWN_OPTIONS = 200;
const MAX_SELECTIONS = 20;
const MAX_PRESETS = 10;
const MAX_PRESET_NAME_LENGTH = 50;

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full" role="search" aria-label="Filter controls">
      <!-- Collapsible toggle for mobile viewports < 768px -->
      <div class="md:hidden flex items-center justify-between mb-2">
        <button
          type="button"
          class="btn btn-sm btn-ghost gap-2"
          (click)="togglePanel()"
          [attr.aria-expanded]="panelExpanded"
          aria-controls="filter-panel"
        >
          <span class="material-symbols-outlined text-lg" aria-hidden="true">filter_list</span>
          Filters
          @if (activeFilterCount > 0) {
            <span class="badge badge-primary badge-sm">{{ activeFilterCount }}</span>
          }
        </button>
      </div>

      <!-- Filter panel -->
      <div
        id="filter-panel"
        class="flex flex-col gap-3"
        [class.hidden]="!panelExpanded"
        [class.md:flex]="true"
      >
        <!-- Filter controls row -->
        <div class="flex flex-wrap gap-3 items-end">
          @for (filter of visibleFilters; track filter.key) {
            <div class="flex flex-col gap-1 min-w-[180px] max-w-[280px]">
              <label
                class="text-xs font-medium text-base-content/70"
                [for]="'filter-' + filter.key"
              >{{ filter.label }}</label>

              <!-- Text search filter -->
              @if (filter.type === 'text') {
                <input
                  type="text"
                  class="input input-bordered input-sm w-full"
                  [id]="'filter-' + filter.key"
                  [placeholder]="filter.placeholder || 'Search...'"
                  [maxlength]="MAX_TEXT_LENGTH"
                  [value]="getTextValue(filter.key)"
                  (input)="onTextInput(filter.key, $event)"
                  [attr.aria-label]="filter.label"
                />
              }

              <!-- Dropdown filter (single or multi-select) -->
              @if (filter.type === 'dropdown') {
                @if (!filter.multiSelect) {
                  <select
                    class="select select-bordered select-sm w-full"
                    [id]="'filter-' + filter.key"
                    [value]="getDropdownValue(filter.key)"
                    (change)="onDropdownChange(filter.key, $event)"
                    [attr.aria-label]="filter.label"
                  >
                    <option value="">{{ filter.placeholder || 'All' }}</option>
                    @for (opt of getFilterOptions(filter); track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                } @else {
                  <div class="dropdown w-full">
                    <div
                      tabindex="0"
                      role="button"
                      class="input input-bordered input-sm w-full flex items-center cursor-pointer"
                      [id]="'filter-' + filter.key"
                      [attr.aria-label]="filter.label + ' multi-select'"
                    >
                      <span class="flex-1 truncate text-sm">
                        {{ getMultiSelectLabel(filter.key, filter) }}
                      </span>
                      <span class="material-symbols-outlined text-sm" aria-hidden="true">expand_more</span>
                    </div>
                    <ul
                      tabindex="0"
                      class="dropdown-content menu bg-base-100 rounded-box z-[1] w-full p-2 shadow max-h-60 overflow-y-auto"
                      role="listbox"
                      [attr.aria-multiselectable]="true"
                    >
                      @for (opt of getFilterOptions(filter); track opt.value) {
                        <li>
                          <label class="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              class="checkbox checkbox-sm checkbox-primary"
                              [checked]="isMultiSelected(filter.key, opt.value)"
                              (change)="onMultiSelectToggle(filter.key, opt.value, filter)"
                              [attr.aria-label]="opt.label"
                            />
                            <span class="text-sm">{{ opt.label }}</span>
                          </label>
                        </li>
                      }
                    </ul>
                  </div>
                }
              }

              <!-- Date range filter -->
              @if (filter.type === 'date-range') {
                <div class="flex gap-2 items-center">
                  <input
                    type="date"
                    class="input input-bordered input-sm flex-1"
                    [id]="'filter-' + filter.key + '-start'"
                    [value]="getDateRangeStart(filter.key)"
                    (change)="onDateRangeStartChange(filter.key, $event)"
                    [attr.aria-label]="filter.label + ' start date'"
                  />
                  <span class="text-xs text-base-content/50">to</span>
                  <input
                    type="date"
                    class="input input-bordered input-sm flex-1"
                    [id]="'filter-' + filter.key + '-end'"
                    [value]="getDateRangeEnd(filter.key)"
                    (change)="onDateRangeEndChange(filter.key, $event)"
                    [attr.aria-label]="filter.label + ' end date'"
                  />
                </div>
                @if (getDateRangeError(filter.key)) {
                  <p class="text-xs text-error mt-1" role="alert">
                    End date must be equal to or after start date
                  </p>
                }
              }

              <!-- Status chip filter -->
              @if (filter.type === 'status-chip') {
                <div class="flex flex-wrap gap-1" role="group" [attr.aria-label]="filter.label">
                  @for (opt of getFilterOptions(filter); track opt.value) {
                    <button
                      type="button"
                      class="badge cursor-pointer transition-colors"
                      [class.badge-primary]="isChipSelected(filter.key, opt.value)"
                      [class.badge-ghost]="!isChipSelected(filter.key, opt.value)"
                      (click)="onChipToggle(filter.key, opt.value)"
                      [attr.aria-pressed]="isChipSelected(filter.key, opt.value)"
                      [attr.aria-label]="opt.label"
                    >{{ opt.label }}</button>
                  }
                </div>
              }

              <!-- Tag filter -->
              @if (filter.type === 'tag') {
                <div class="flex flex-wrap gap-1" role="group" [attr.aria-label]="filter.label">
                  @for (opt of getFilterOptions(filter); track opt.value) {
                    <button
                      type="button"
                      class="badge badge-sm cursor-pointer transition-colors"
                      [class.badge-secondary]="isTagSelected(filter.key, opt.value)"
                      [class.badge-outline]="!isTagSelected(filter.key, opt.value)"
                      (click)="onTagToggle(filter.key, opt.value)"
                      [attr.aria-pressed]="isTagSelected(filter.key, opt.value)"
                      [attr.aria-label]="opt.label"
                    >{{ opt.label }}</button>
                  }
                </div>
              }
            </div>
          }

          <!-- Reset button -->
          <div class="flex items-end">
            <button
              type="button"
              class="btn btn-ghost btn-sm gap-1"
              (click)="onReset()"
              [disabled]="activeFilterCount === 0"
              aria-label="Reset all filters"
            >
              <span class="material-symbols-outlined text-sm" aria-hidden="true">restart_alt</span>
              Reset
            </button>
          </div>
        </div>

        <!-- Active filter chips and count -->
        @if (activeFilterCount > 0) {
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="badge badge-primary badge-sm" aria-label="Active filter count">
              {{ activeFilterCount }} active
            </span>
            @for (chip of activeChips; track chip.key + chip.value) {
              <span class="badge badge-outline badge-sm gap-1">
                {{ chip.label }}
                <button
                  type="button"
                  class="text-base-content/50 hover:text-base-content"
                  (click)="removeChip(chip)"
                  [attr.aria-label]="'Remove filter: ' + chip.label"
                >
                  <span class="material-symbols-outlined text-xs" aria-hidden="true">close</span>
                </button>
              </span>
            }
          </div>
        }

        <!-- Saved presets -->
        @if (savedPresets.length > 0 || activeFilterCount > 0) {
          <div class="flex flex-wrap items-center gap-2 mt-2">
            @if (savedPresets.length > 0) {
              <div class="dropdown">
                <button
                  tabindex="0"
                  type="button"
                  class="btn btn-ghost btn-xs gap-1"
                  aria-label="Load saved preset"
                >
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">bookmark</span>
                  Presets
                </button>
                <ul
                  tabindex="0"
                  class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                >
                  @for (preset of savedPresets; track preset.id) {
                    <li>
                      <div class="flex items-center justify-between w-full">
                        <button
                          type="button"
                          class="flex-1 text-left text-sm"
                          (click)="onLoadPreset(preset.id)"
                        >{{ preset.name }}</button>
                        <button
                          type="button"
                          class="btn btn-ghost btn-xs"
                          (click)="onDeletePreset(preset.id); $event.stopPropagation()"
                          [attr.aria-label]="'Delete preset: ' + preset.name"
                        >
                          <span class="material-symbols-outlined text-xs" aria-hidden="true">delete</span>
                        </button>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }

            @if (activeFilterCount > 0 && savedPresets.length < MAX_PRESETS) {
              <button
                type="button"
                class="btn btn-ghost btn-xs gap-1"
                (click)="onSavePreset()"
                aria-label="Save current filters as preset"
              >
                <span class="material-symbols-outlined text-sm" aria-hidden="true">save</span>
                Save Preset
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class FilterBarComponent implements OnInit, OnDestroy {
  /** Filter definitions (max 10) */
  @Input() filters: IFilterDefinition[] = [];

  /** Saved filter presets */
  @Input() savedPresets: IFilterPreset[] = [];

  /** Emits when any filter value changes */
  @Output() filterChange = new EventEmitter<Record<string, unknown>>();

  /** Emits when reset is clicked */
  @Output() resetClick = new EventEmitter<void>();

  /** Emits when a preset is saved */
  @Output() presetSave = new EventEmitter<{ name: string; values: Record<string, unknown> }>();

  /** Emits when a preset is loaded */
  @Output() presetLoad = new EventEmitter<string>();

  /** Emits when a preset is deleted */
  @Output() presetDelete = new EventEmitter<string>();

  /** Expose constant for template usage */
  readonly MAX_TEXT_LENGTH = MAX_TEXT_LENGTH;
  readonly MAX_PRESETS = MAX_PRESETS;

  /** Mobile panel expanded state */
  panelExpanded = true;

  /** Internal filter values keyed by filter key */
  filterValues: Record<string, unknown> = {};

  /** Date range validation errors */
  dateRangeErrors: Record<string, boolean> = {};

  /** Active filter count */
  activeFilterCount = 0;

  /** Active filter chips for display */
  activeChips: Array<{ key: string; value: string; label: string }> = [];

  /** Text input debounce subjects keyed by filter key */
  private textSubjects: Record<string, Subject<string>> = {};
  private subscriptions: Subscription[] = [];

  constructor(private readonly cdr: ChangeDetectorRef) {}

  /** Visible filters capped at MAX_FILTERS */
  get visibleFilters(): IFilterDefinition[] {
    return this.filters.slice(0, MAX_FILTERS);
  }

  ngOnInit(): void {
    this.initializeFilterValues();
    this.setupTextDebounce();
    this.checkMobileViewport();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    Object.values(this.textSubjects).forEach(sub => sub.complete());
  }

  /** Toggle the mobile collapsible panel */
  togglePanel(): void {
    this.panelExpanded = !this.panelExpanded;
  }

  // --- Text filter methods ---

  getTextValue(key: string): string {
    return (this.filterValues[key] as string) || '';
  }

  onTextInput(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.slice(0, MAX_TEXT_LENGTH);
    this.filterValues[key] = value;
    if (this.textSubjects[key]) {
      this.textSubjects[key].next(value);
    }
  }

  // --- Dropdown filter methods ---

  getDropdownValue(key: string): string {
    return (this.filterValues[key] as string) || '';
  }

  onDropdownChange(key: string, event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterValues[key] = select.value || null;
    this.emitFilterChange();
  }

  // --- Multi-select dropdown methods ---

  getMultiSelectLabel(key: string, filter: IFilterDefinition): string {
    const raw = this.filterValues[key];
    const selected = Array.isArray(raw) ? raw : [];
    if (selected.length === 0) {
      return filter.placeholder || 'Select...';
    }
    return `${selected.length} selected`;
  }

  isMultiSelected(key: string, value: string): boolean {
    const raw = this.filterValues[key];
    const selected = Array.isArray(raw) ? raw : [];
    return selected.includes(value);
  }

  onMultiSelectToggle(key: string, value: string, filter: IFilterDefinition): void {
    const raw = this.filterValues[key];
    const selected = [...(Array.isArray(raw) ? raw : [])];
    const index = selected.indexOf(value);
    const maxSel = filter.maxSelections || MAX_SELECTIONS;

    if (index >= 0) {
      selected.splice(index, 1);
    } else if (selected.length < maxSel) {
      selected.push(value);
    }

    this.filterValues[key] = selected;
    this.emitFilterChange();
  }

  // --- Date range filter methods ---

  getDateRangeStart(key: string): string {
    const range = this.filterValues[key] as IDateRangeValue | null;
    return range?.start || '';
  }

  getDateRangeEnd(key: string): string {
    const range = this.filterValues[key] as IDateRangeValue | null;
    return range?.end || '';
  }

  getDateRangeError(key: string): boolean {
    return this.dateRangeErrors[key] || false;
  }

  onDateRangeStartChange(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const current = (this.filterValues[key] as IDateRangeValue) || { start: null, end: null };
    const updated: IDateRangeValue = { ...current, start: input.value || null };
    this.filterValues[key] = updated;
    this.validateAndEmitDateRange(key, updated);
  }

  onDateRangeEndChange(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const current = (this.filterValues[key] as IDateRangeValue) || { start: null, end: null };
    const updated: IDateRangeValue = { ...current, end: input.value || null };
    this.filterValues[key] = updated;
    this.validateAndEmitDateRange(key, updated);
  }

  // --- Status chip filter methods ---

  isChipSelected(key: string, value: string): boolean {
    const raw = this.filterValues[key];
    const selected = Array.isArray(raw) ? raw : [];
    return selected.includes(value);
  }

  onChipToggle(key: string, value: string): void {
    const raw = this.filterValues[key];
    const selected = [...(Array.isArray(raw) ? raw : [])];
    const index = selected.indexOf(value);

    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      selected.push(value);
    }

    this.filterValues[key] = selected;
    this.emitFilterChange();
  }

  // --- Tag filter methods ---

  isTagSelected(key: string, value: string): boolean {
    const raw = this.filterValues[key];
    const selected = Array.isArray(raw) ? raw : [];
    return selected.includes(value);
  }

  onTagToggle(key: string, value: string): void {
    const raw = this.filterValues[key];
    const selected = [...(Array.isArray(raw) ? raw : [])];
    const index = selected.indexOf(value);

    if (index >= 0) {
      selected.splice(index, 1);
    } else {
      selected.push(value);
    }

    this.filterValues[key] = selected;
    this.emitFilterChange();
  }

  // --- Filter options helper ---

  getFilterOptions(filter: IFilterDefinition): IFilterOption[] {
    return (filter.options || []).slice(0, MAX_DROPDOWN_OPTIONS);
  }

  // --- Reset ---

  onReset(): void {
    this.initializeFilterValues();
    this.dateRangeErrors = {};
    this.updateActiveState();
    this.resetClick.emit();
    this.filterChange.emit(this.buildFilterChangePayload());
    this.cdr.markForCheck();
  }

  // --- Active chip removal ---

  removeChip(chip: { key: string; value: string; label: string }): void {
    const filter = this.visibleFilters.find(f => f.key === chip.key);
    if (!filter) return;

    switch (filter.type) {
      case 'text':
        this.filterValues[chip.key] = '';
        break;
      case 'dropdown':
        if (filter.multiSelect) {
          const selected = [...((this.filterValues[chip.key] as string[]) || [])];
          const idx = selected.indexOf(chip.value);
          if (idx >= 0) selected.splice(idx, 1);
          this.filterValues[chip.key] = selected;
        } else {
          this.filterValues[chip.key] = null;
        }
        break;
      case 'date-range':
        this.filterValues[chip.key] = { start: null, end: null };
        this.dateRangeErrors[chip.key] = false;
        break;
      case 'status-chip':
      case 'tag': {
        const sel = [...((this.filterValues[chip.key] as string[]) || [])];
        const i = sel.indexOf(chip.value);
        if (i >= 0) sel.splice(i, 1);
        this.filterValues[chip.key] = sel;
        break;
      }
    }

    this.emitFilterChange();
  }

  // --- Preset methods ---

  onLoadPreset(presetId: string): void {
    const preset = this.savedPresets.find(p => p.id === presetId);
    if (preset) {
      this.filterValues = { ...preset.values };
      this.updateActiveState();
      this.filterChange.emit(this.buildFilterChangePayload());
      this.cdr.markForCheck();
    }
    this.presetLoad.emit(presetId);
  }

  onDeletePreset(presetId: string): void {
    this.presetDelete.emit(presetId);
  }

  onSavePreset(): void {
    const name = prompt('Enter preset name (max 50 characters):');
    if (!name || name.trim().length === 0) return;
    const trimmedName = name.trim().slice(0, MAX_PRESET_NAME_LENGTH);
    this.presetSave.emit({
      name: trimmedName,
      values: { ...this.filterValues },
    });
  }

  // --- Private methods ---

  private initializeFilterValues(): void {
    this.filterValues = {};
    for (const filter of this.visibleFilters) {
      switch (filter.type) {
        case 'text':
          this.filterValues[filter.key] = '';
          break;
        case 'dropdown':
          this.filterValues[filter.key] = filter.multiSelect ? [] : null;
          break;
        case 'date-range':
          this.filterValues[filter.key] = { start: null, end: null } as IDateRangeValue;
          break;
        case 'status-chip':
        case 'tag':
          this.filterValues[filter.key] = [];
          break;
      }
    }
  }

  private setupTextDebounce(): void {
    for (const filter of this.visibleFilters) {
      if (filter.type === 'text') {
        const subject = new Subject<string>();
        this.textSubjects[filter.key] = subject;

        const sub = subject.pipe(
          debounceTime(TEXT_DEBOUNCE_MS),
          distinctUntilChanged()
        ).subscribe(() => {
          this.emitFilterChange();
        });

        this.subscriptions.push(sub);
      }
    }
  }

  private validateAndEmitDateRange(key: string, range: IDateRangeValue): void {
    if (range.start && range.end) {
      const startDate = new Date(range.start);
      const endDate = new Date(range.end);
      if (endDate < startDate) {
        this.dateRangeErrors[key] = true;
        this.updateActiveState();
        this.cdr.markForCheck();
        return;
      }
    }
    this.dateRangeErrors[key] = false;
    this.emitFilterChange();
  }

  private emitFilterChange(): void {
    this.updateActiveState();
    this.filterChange.emit(this.buildFilterChangePayload());
    this.cdr.markForCheck();
  }

  private buildFilterChangePayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const filter of this.visibleFilters) {
      payload[filter.key] = this.filterValues[filter.key] ?? null;
    }
    return payload;
  }

  private updateActiveState(): void {
    let count = 0;
    const chips: Array<{ key: string; value: string; label: string }> = [];

    for (const filter of this.visibleFilters) {
      const value = this.filterValues[filter.key];

      if (this.isFilterActive(filter, value)) {
        count++;
        this.buildChipsForFilter(filter, value, chips);
      }
    }

    this.activeFilterCount = count;
    this.activeChips = chips;
  }

  private isFilterActive(filter: IFilterDefinition, value: unknown): boolean {
    if (value === null || value === undefined) return false;

    switch (filter.type) {
      case 'text':
        return typeof value === 'string' && value.length > 0;
      case 'dropdown':
        if (filter.multiSelect) {
          return Array.isArray(value) && value.length > 0;
        }
        return value !== null && value !== '';
      case 'date-range': {
        const range = value as IDateRangeValue;
        return !!(range.start || range.end);
      }
      case 'status-chip':
      case 'tag':
        return Array.isArray(value) && value.length > 0;
      default:
        return false;
    }
  }

  private buildChipsForFilter(
    filter: IFilterDefinition,
    value: unknown,
    chips: Array<{ key: string; value: string; label: string }>
  ): void {
    switch (filter.type) {
      case 'text':
        chips.push({
          key: filter.key,
          value: value as string,
          label: `${filter.label}: "${(value as string).slice(0, 20)}${(value as string).length > 20 ? '…' : ''}"`,
        });
        break;
      case 'dropdown':
        if (filter.multiSelect) {
          for (const v of value as string[]) {
            const opt = filter.options?.find(o => o.value === v);
            chips.push({
              key: filter.key,
              value: v,
              label: `${filter.label}: ${opt?.label || v}`,
            });
          }
        } else {
          const opt = filter.options?.find(o => o.value === value);
          chips.push({
            key: filter.key,
            value: value as string,
            label: `${filter.label}: ${opt?.label || value}`,
          });
        }
        break;
      case 'date-range': {
        const range = value as IDateRangeValue;
        const parts: string[] = [];
        if (range.start) parts.push(`from ${range.start}`);
        if (range.end) parts.push(`to ${range.end}`);
        chips.push({
          key: filter.key,
          value: 'range',
          label: `${filter.label}: ${parts.join(' ')}`,
        });
        break;
      }
      case 'status-chip':
      case 'tag':
        for (const v of value as string[]) {
          const opt = filter.options?.find(o => o.value === v);
          chips.push({
            key: filter.key,
            value: v,
            label: `${filter.label}: ${opt?.label || v}`,
          });
        }
        break;
    }
  }

  private checkMobileViewport(): void {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.panelExpanded = false;
    }
  }
}
