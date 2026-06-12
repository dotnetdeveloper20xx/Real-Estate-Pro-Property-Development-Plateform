import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IApplicationListItem } from '../../models/planning-application.model';

/**
 * Presentational component that renders a single planning application card
 * within the pipeline Kanban view.
 *
 * Displays: Description, ApplicationType badge, CouncilName,
 * LandOpportunity Name, and days since last status change.
 *
 * Requirements: 14.2
 */
@Component({
  selector: 'app-application-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="card card-compact bg-base-100 border border-base-200 cursor-pointer
             hover:border-primary/40 hover:shadow-md transition-all duration-200"
      role="button"
      tabindex="0"
      [attr.aria-label]="'Application: ' + application.description"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick(); $event.preventDefault()"
    >
      <div class="card-body p-4 space-y-2">
        <!-- Description -->
        <h3 class="text-sm font-medium text-base-content line-clamp-2">
          {{ application.description }}
        </h3>

        <!-- Application Type Badge -->
        <div class="flex items-center gap-2">
          <span class="badge badge-outline badge-xs" [ngClass]="getTypeBadgeClass()">
            {{ formatApplicationType(application.applicationType) }}
          </span>
        </div>

        <!-- Council Name -->
        <p class="text-xs text-base-content/60 truncate" [title]="application.councilName">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          {{ application.councilName }}
        </p>

        <!-- Land Opportunity Name -->
        <p
          *ngIf="application.landOpportunityName"
          class="text-xs text-base-content/50 truncate"
          [title]="application.landOpportunityName"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {{ application.landOpportunityName }}
        </p>

        <!-- Footer: Days since last change -->
        <div class="flex items-center justify-between pt-1 border-t border-base-200">
          <span class="text-xs text-base-content/40">
            {{ getDaysSinceCreated() }}d ago
          </span>
          <span
            *ngIf="application.applicationReference"
            class="text-xs text-base-content/50 font-mono"
          >
            {{ application.applicationReference }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class ApplicationCardComponent {
  @Input({ required: true }) application!: IApplicationListItem;
  @Output() cardClick = new EventEmitter<IApplicationListItem>();

  onCardClick(): void {
    this.cardClick.emit(this.application);
  }

  /**
   * Calculates days since the application was created (approximation for days since last status change).
   */
  getDaysSinceCreated(): number {
    const created = new Date(this.application.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * Formats the PlanningApplicationType enum value into a human-readable label.
   */
  formatApplicationType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /**
   * Returns DaisyUI badge class based on application type.
   */
  getTypeBadgeClass(): string {
    switch (this.application.applicationType) {
      case 'Full':
        return 'badge-primary';
      case 'Outline':
        return 'badge-secondary';
      case 'ReservedMatters':
        return 'badge-accent';
      case 'Householder':
        return 'badge-info';
      case 'ListedBuilding':
        return 'badge-warning';
      case 'ChangeOfUse':
        return 'badge-neutral';
      default:
        return 'badge-ghost';
    }
  }
}
