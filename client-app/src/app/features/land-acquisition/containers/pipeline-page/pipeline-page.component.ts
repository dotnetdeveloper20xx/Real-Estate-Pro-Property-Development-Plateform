import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { OpportunityActions } from '../../store/opportunity/opportunity.actions';
import {
  selectOpportunitiesByStatus,
  selectOpportunityLoading,
  selectOpportunityError
} from '../../store/opportunity/opportunity.selectors';
import { PipelineColumnComponent } from '../../components/pipeline-column/pipeline-column.component';
import { IOpportunityListItem, OpportunityStatus } from '../../models/opportunity.model';

/**
 * Pipeline container page — displays opportunities grouped by status
 * in a horizontally scrollable Kanban-style board.
 *
 * Responsibilities:
 * - Dispatches loadOpportunities on init to populate the store
 * - Groups opportunities by status into 7 pipeline columns
 * - Shows skeleton loading state while data is being fetched
 * - Shows error state with retry button on failure
 * - Navigates to opportunity detail on card click
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
@Component({
  selector: 'app-pipeline-page',
  standalone: true,
  imports: [CommonModule, PipelineColumnComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Opportunity Pipeline</h1>
          <p class="text-sm text-base-content/60">
            View and manage opportunities across lifecycle stages. Click a card to view details.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge badge-neutral badge-outline text-xs">
            {{ getTotalCount() }} total opportunities
          </span>
        </div>
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
          <h2 class="text-lg font-semibold text-base-content mb-1">Unable to Load Pipeline</h2>
          <p class="text-sm text-base-content/60 mb-4 text-center max-w-md">
            {{ error }}
          </p>
          <button
            class="btn btn-error btn-sm"
            (click)="onRetry()"
            aria-label="Retry loading pipeline data"
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
        <div
          class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
          aria-label="Loading pipeline data"
          role="status"
        >
          <div
            *ngFor="let col of skeletonColumns"
            class="flex flex-col h-[600px] min-w-[280px] max-w-[320px] bg-base-200/50 rounded-xl animate-pulse"
          >
            <!-- Skeleton Column Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-base-300">
              <div class="h-4 w-24 bg-base-300 rounded"></div>
              <div class="h-5 w-6 bg-base-300 rounded-full"></div>
            </div>

            <!-- Skeleton Cards -->
            <div class="flex flex-col gap-3 p-3">
              <div
                *ngFor="let card of col.cards"
                class="card card-compact bg-base-100 border border-base-200"
              >
                <div class="card-body p-4 space-y-2">
                  <div class="h-4 bg-base-300 rounded" [style.width]="card.titleWidth"></div>
                  <div class="h-3 w-3/4 bg-base-300 rounded"></div>
                  <div class="flex justify-between">
                    <div class="h-5 w-16 bg-base-300 rounded"></div>
                    <div class="h-3 w-8 bg-base-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span class="sr-only">Loading pipeline data, please wait...</span>
        </div>
      </ng-container>

      <!-- Pipeline Board -->
      <ng-container *ngIf="!(loading$ | async) && !(error$ | async)">
        <div
          class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
          role="region"
          aria-label="Opportunity pipeline board"
        >
          @for (column of pipelineColumns; track column.status) {
            <app-pipeline-column
              [status]="formatStatusLabel(column.status)"
              [count]="getColumnOpportunities(column.status).length"
              [opportunities]="getColumnOpportunities(column.status)"
              (cardClick)="onCardClick($event)"
            />
          }
        </div>
      </ng-container>
    </div>
  `
})
export class PipelinePageComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly router = inject(Router);
  private subscription: Subscription | null = null;

  /** Observable of opportunities grouped by status. */
  readonly opportunitiesByStatus$: Observable<Record<OpportunityStatus, readonly IOpportunityListItem[]>> =
    this.store.select(selectOpportunitiesByStatus);

  /** Observable of loading state. */
  readonly loading$: Observable<boolean> = this.store.select(selectOpportunityLoading);

  /** Observable of error state. */
  readonly error$: Observable<string | null> = this.store.select(selectOpportunityError);

  /** Pipeline columns definition in display order. */
  readonly pipelineColumns: readonly PipelineColumn[] = [
    { status: OpportunityStatus.Identified },
    { status: OpportunityStatus.InitialReview },
    { status: OpportunityStatus.DueDiligence },
    { status: OpportunityStatus.OfferMade },
    { status: OpportunityStatus.UnderContract },
    { status: OpportunityStatus.Acquired },
    { status: OpportunityStatus.Withdrawn }
  ];

  /** Skeleton columns for loading state with varying card counts. */
  readonly skeletonColumns = [
    { cards: [{ titleWidth: '80%' }, { titleWidth: '60%' }, { titleWidth: '70%' }] },
    { cards: [{ titleWidth: '65%' }, { titleWidth: '75%' }] },
    { cards: [{ titleWidth: '90%' }, { titleWidth: '55%' }, { titleWidth: '70%' }] },
    { cards: [{ titleWidth: '70%' }] },
    { cards: [{ titleWidth: '85%' }, { titleWidth: '60%' }] },
    { cards: [{ titleWidth: '75%' }] },
    { cards: [{ titleWidth: '60%' }, { titleWidth: '80%' }] }
  ];

  /** Cached snapshot of grouped opportunities for synchronous template access. */
  private groupedOpportunities: Record<OpportunityStatus, readonly IOpportunityListItem[]> = {
    [OpportunityStatus.Identified]: [],
    [OpportunityStatus.InitialReview]: [],
    [OpportunityStatus.DueDiligence]: [],
    [OpportunityStatus.OfferMade]: [],
    [OpportunityStatus.UnderContract]: [],
    [OpportunityStatus.Acquired]: [],
    [OpportunityStatus.Withdrawn]: []
  };

  ngOnInit(): void {
    this.store.dispatch(OpportunityActions.loadOpportunities());

    // Subscribe to grouped opportunities for synchronous template access
    this.subscription = this.opportunitiesByStatus$.subscribe(grouped => {
      this.groupedOpportunities = grouped;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /**
   * Returns the opportunities array for a given status column.
   */
  getColumnOpportunities(status: OpportunityStatus): IOpportunityListItem[] {
    return [...(this.groupedOpportunities[status] ?? [])];
  }

  /**
   * Calculates total count across all pipeline columns.
   */
  getTotalCount(): number {
    return Object.values(this.groupedOpportunities).reduce(
      (total, opportunities) => total + opportunities.length,
      0
    );
  }

  /**
   * Navigates to the opportunity detail page when a card is clicked.
   */
  onCardClick(opportunity: IOpportunityListItem): void {
    this.router.navigate(['/land-acquisition', 'opportunities', opportunity.id]);
  }

  /**
   * Retries loading opportunities after a failure.
   */
  onRetry(): void {
    this.store.dispatch(OpportunityActions.loadOpportunities());
  }

  /**
   * Formats an OpportunityStatus enum value into a human-readable label.
   */
  formatStatusLabel(status: OpportunityStatus): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }
}

/** Pipeline column definition. */
interface PipelineColumn {
  readonly status: OpportunityStatus;
}
