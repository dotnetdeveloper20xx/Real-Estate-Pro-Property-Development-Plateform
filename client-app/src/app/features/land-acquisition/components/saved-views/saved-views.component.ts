import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IOpportunityFilters } from '../../store/opportunity';

/**
 * Represents a saved filter view configuration persisted in localStorage.
 */
export interface ISavedView {
  readonly id: string;
  readonly name: string;
  readonly filters: IOpportunityFilters;
  readonly createdAt: string;
}

/** localStorage key for persisting saved views */
const STORAGE_KEY = 'be_opportunity_saved_views';

/**
 * Presentational component for saving, loading, and deleting named filter views.
 * Persists views to localStorage for user-specific preferences without backend storage.
 *
 * Usage:
 * ```html
 * <app-saved-views
 *   [currentFilters]="filters$ | async"
 *   (viewSelected)="onViewSelected($event)"
 *   (viewSaved)="onViewSaved()">
 * </app-saved-views>
 * ```
 */
@Component({
  selector: 'app-saved-views',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      <!-- Saved views list -->
      @if (savedViews.length > 0) {
        <div class="flex flex-wrap gap-2">
          @for (view of savedViews; track view.id) {
            <div class="btn-group">
              <button
                type="button"
                class="btn btn-sm btn-outline btn-primary"
                [attr.aria-label]="'Apply saved view: ' + view.name"
                (click)="onSelectView(view)">
                {{ view.name }}
              </button>
              <button
                type="button"
                class="btn btn-sm btn-outline btn-error"
                [attr.aria-label]="'Delete saved view: ' + view.name"
                (click)="onDeleteView(view.id)">
                ✕
              </button>
            </div>
          }
        </div>
      }

      <!-- Save view form -->
      @if (showSaveForm) {
        <div class="flex items-center gap-2">
          <input
            type="text"
            class="input input-sm input-bordered w-48"
            placeholder="View name"
            [(ngModel)]="newViewName"
            [attr.aria-label]="'Name for saved view'"
            (keydown.enter)="onSaveView()"
            maxlength="50" />
          <button
            type="button"
            class="btn btn-sm btn-primary"
            [disabled]="!newViewName.trim()"
            (click)="onSaveView()">
            Save
          </button>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            (click)="showSaveForm = false">
            Cancel
          </button>
        </div>
      } @else {
        <button
          type="button"
          class="btn btn-sm btn-ghost gap-1"
          (click)="showSaveForm = true"
          aria-label="Save current filters as a new view">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5v14l7-5 7 5V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
          </svg>
          Save View
        </button>
      }
    </div>
  `
})
export class SavedViewsComponent implements OnInit {
  @Input({ required: true }) currentFilters!: IOpportunityFilters;

  @Output() viewSelected = new EventEmitter<IOpportunityFilters>();
  @Output() viewSaved = new EventEmitter<void>();

  savedViews: ISavedView[] = [];
  showSaveForm = false;
  newViewName = '';

  ngOnInit(): void {
    this.loadViews();
  }

  /**
   * Applies the selected view's filters by emitting them to the parent.
   */
  onSelectView(view: ISavedView): void {
    this.viewSelected.emit(view.filters);
  }

  /**
   * Saves the current filters as a named view and persists to localStorage.
   */
  onSaveView(): void {
    const trimmedName = this.newViewName.trim();
    if (!trimmedName) {
      return;
    }

    const newView: ISavedView = {
      id: crypto.randomUUID(),
      name: trimmedName,
      filters: { ...this.currentFilters },
      createdAt: new Date().toISOString()
    };

    this.savedViews = [...this.savedViews, newView];
    this.persistViews();
    this.newViewName = '';
    this.showSaveForm = false;
    this.viewSaved.emit();
  }

  /**
   * Removes a saved view by ID and updates localStorage.
   */
  onDeleteView(viewId: string): void {
    this.savedViews = this.savedViews.filter(v => v.id !== viewId);
    this.persistViews();
  }

  private loadViews(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.savedViews = JSON.parse(raw) as ISavedView[];
      }
    } catch {
      this.savedViews = [];
    }
  }

  private persistViews(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.savedViews));
    } catch {
      // Storage full or unavailable — silently fail
    }
  }
}
