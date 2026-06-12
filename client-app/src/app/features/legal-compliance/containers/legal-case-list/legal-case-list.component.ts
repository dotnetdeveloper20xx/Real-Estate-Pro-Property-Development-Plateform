import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';

import { LegalCasesActions } from '../../store/legal-cases/legal-cases.actions';
import {
  selectLegalCasesPipeline,
  selectLegalCasesPipelineLoading,
  selectLegalCasesError
} from '../../store/legal-cases/legal-cases.selectors';
import { CaseCardComponent } from '../../components/case-card/case-card.component';
import {
  ILegalCaseListItem,
  ILegalCasePipeline,
  LegalCaseStatus
} from '../../models/legal-case.model';

/**
 * LegalCaseListComponent — Smart container component that displays the Legal Case Pipeline.
 *
 * Renders a kanban-style board with columns grouped by LegalCaseStatus.
 * Each column contains case-card components representing individual legal cases.
 *
 * Responsibilities:
 * - Dispatches LegalCasesActions.loadPipeline on init to fetch pipeline data
 * - Subscribes to selectLegalCasesPipeline for board data
 * - Renders skeleton loading state while data is fetched
 * - Renders error state with retry button on failure
 * - Navigates to case detail view on card click
 *
 * Requirements: 14.1, 14.2, 14.4, 14.5, 14.6
 */
@Component({
  selector: 'app-legal-case-list',
  standalone: true,
  imports: [CommonModule, CaseCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Page Header -->
    <div class="p-6 space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-bold text-base-content">Legal Case Pipeline</h1>
          <p class="text-sm text-base-content/60">
            Track legal cases across lifecycle stages. Click a card to view full case details.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span
            *ngIf="(pipeline$ | async) as pipeline"
            class="badge badge-neutral badge-outline text-xs"
          >
            {{ getTotalCaseCount(pipeline) }} total cases
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 text-error mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h2 class="text-lg font-semibold text-base-content mb-1">Unable to Load Pipeline</h2>
          <p class="text-sm text-base-content/60 mb-4 text-center max-w-md">
            {{ error }}
          </p>
          <button
            class="btn btn-error btn-sm"
            (click)="onRetry()"
            aria-label="Retry loading legal case pipeline data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Retry
          </button>
        </div>
      </ng-container>

      <!-- Skeleton Loading State -->
      <ng-container *ngIf="(pipelineLoading$ | async) && !(error$ | async)">
        <div
          class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
          aria-label="Loading legal case pipeline data"
          role="status"
        >
          <div
            *ngFor="let col of skeletonColumns"
            class="flex flex-col min-w-[280px] max-w-[320px] w-[300px] bg-base-200/50 rounded-xl animate-pulse"
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
                  <div class="flex gap-2">
                    <div class="h-4 w-16 bg-base-300 rounded"></div>
                    <div class="h-4 w-12 bg-base-300 rounded"></div>
                  </div>
                  <div class="flex justify-between pt-1 border-t border-base-200">
                    <div class="h-3 w-10 bg-base-300 rounded"></div>
                    <div class="h-3 w-20 bg-base-300 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <span class="sr-only">Loading legal case pipeline data, please wait...</span>
        </div>
      </ng-container>

      <!-- Pipeline Board (Kanban) -->
      <ng-container *ngIf="!(pipelineLoading$ | async) && !(error$ | async)">
        <ng-container *ngIf="(pipeline$ | async) as pipeline">
          <!-- Empty State -->
          <div
            *ngIf="pipeline.length === 0"
            class="flex flex-col items-center justify-center p-16 rounded-xl border border-base-200 bg-base-100"
            role="status"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-16 w-16 text-base-content/20 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h2 class="text-lg font-semibold text-base-content mb-1">No Legal Cases Found</h2>
            <p class="text-sm text-base-content/60 text-center max-w-sm">
              Create your first legal case to begin tracking legal matters across the pipeline.
            </p>
          </div>

          <!-- Kanban Board -->
          <div
            *ngIf="pipeline.length > 0"
            class="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2"
            role="region"
            aria-label="Legal case pipeline board"
          >
            <div
              *ngFor="let column of pipeline; trackBy: trackByStatus"
              class="flex flex-col min-w-[280px] max-w-[320px] w-[300px] bg-base-200/30 rounded-xl border border-base-200"
            >
              <!-- Column Header -->
              <div class="flex items-center justify-between px-4 py-3 border-b border-base-200">
                <div class="flex items-center gap-2">
                  <span
                    class="w-2.5 h-2.5 rounded-full"
                    [ngClass]="getStatusIndicatorClass(column.status)"
                  ></span>
                  <h2 class="text-sm font-semibold text-base-content">
                    {{ formatStatusLabel(column.status) }}
                  </h2>
                </div>
                <span class="badge badge-sm badge-neutral">
                  {{ column.count }}
                </span>
              </div>

              <!-- Column Body (scrollable) -->
              <div
                class="flex flex-col gap-3 p-3 overflow-y-auto max-h-[600px]"
                [attr.aria-label]="formatStatusLabel(column.status) + ' cases'"
              >
                <!-- Cases -->
                <app-case-card
                  *ngFor="let legalCase of column.cases; trackBy: trackByCaseId"
                  [legalCase]="legalCase"
                  (cardClick)="onCaseCardClick($event)"
                />

                <!-- Empty column state -->
                <div
                  *ngIf="column.cases.length === 0"
                  class="flex flex-col items-center justify-center py-8 text-base-content/30"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-8 w-8 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <span class="text-xs">No cases</span>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `
})
export class LegalCaseListComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  /** Observable of pipeline data (cases grouped by status). */
  readonly pipeline$: Observable<readonly ILegalCasePipeline[] | null> =
    this.store.select(selectLegalCasesPipeline);

  /** Observable of pipeline loading state. */
  readonly pipelineLoading$: Observable<boolean> =
    this.store.select(selectLegalCasesPipelineLoading);

  /** Observable of error state. */
  readonly error$: Observable<string | null> =
    this.store.select(selectLegalCasesError);

  /** Skeleton columns for loading state with varying card counts. */
  readonly skeletonColumns: readonly SkeletonColumn[] = [
    { cards: [{ titleWidth: '80%' }, { titleWidth: '60%' }, { titleWidth: '70%' }] },
    { cards: [{ titleWidth: '65%' }, { titleWidth: '75%' }] },
    { cards: [{ titleWidth: '90%' }, { titleWidth: '55%' }, { titleWidth: '70%' }, { titleWidth: '65%' }] },
    { cards: [{ titleWidth: '70%' }] },
    { cards: [{ titleWidth: '85%' }, { titleWidth: '60%' }] },
    { cards: [{ titleWidth: '75%' }, { titleWidth: '80%' }] },
    { cards: [{ titleWidth: '60%' }] }
  ];

  ngOnInit(): void {
    this.store.dispatch(LegalCasesActions.loadPipeline());
  }

  /**
   * Calculates total case count across all pipeline columns.
   */
  getTotalCaseCount(pipeline: readonly ILegalCasePipeline[]): number {
    return pipeline.reduce((total, column) => total + column.count, 0);
  }

  /**
   * Handles case card click — navigates to the case detail view.
   */
  onCaseCardClick(legalCase: ILegalCaseListItem): void {
    this.router.navigate(['/legal-compliance', 'cases', legalCase.id]);
  }

  /**
   * Retries loading pipeline data after a failure.
   */
  onRetry(): void {
    this.store.dispatch(LegalCasesActions.loadPipeline());
  }

  /**
   * Formats a LegalCaseStatus enum value into a human-readable column label.
   */
  formatStatusLabel(status: LegalCaseStatus): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /**
   * Returns a colour class for the status indicator dot based on status.
   */
  getStatusIndicatorClass(status: LegalCaseStatus): string {
    switch (status) {
      case LegalCaseStatus.Open:
        return 'bg-info';
      case LegalCaseStatus.InProgress:
        return 'bg-primary';
      case LegalCaseStatus.UnderReview:
        return 'bg-warning';
      case LegalCaseStatus.OnHold:
        return 'bg-neutral';
      case LegalCaseStatus.Escalated:
        return 'bg-error';
      case LegalCaseStatus.Resolved:
        return 'bg-success';
      case LegalCaseStatus.Closed:
        return 'bg-base-content/30';
      case LegalCaseStatus.Reopened:
        return 'bg-secondary';
      default:
        return 'bg-base-300';
    }
  }

  /**
   * TrackBy function for pipeline columns.
   */
  trackByStatus(_index: number, column: ILegalCasePipeline): LegalCaseStatus {
    return column.status;
  }

  /**
   * TrackBy function for case cards.
   */
  trackByCaseId(_index: number, legalCase: ILegalCaseListItem): string {
    return legalCase.id;
  }
}

/** Shape for skeleton loading column definitions. */
interface SkeletonColumn {
  readonly cards: readonly { readonly titleWidth: string }[];
}
