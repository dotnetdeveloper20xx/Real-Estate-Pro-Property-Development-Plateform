import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Trend direction for the KPI metric card indicator.
 */
export type KpiTrendDirection = 'up' | 'down' | 'flat';

/**
 * KpiCardComponent — A presentational component that displays a single KPI metric
 * with a prominent value, optional unit suffix, label below, and an optional trend
 * direction indicator.
 *
 * Uses DaisyUI card styling with Tailwind utility classes.
 * Designed for the Planning & Approvals Dashboard (Requirement 18.1).
 *
 * @example
 * ```html
 * <app-planning-kpi-card
 *   label="Average Decision Time"
 *   [value]="45"
 *   unit="days"
 *   trendDirection="down">
 * </app-planning-kpi-card>
 *
 * <app-planning-kpi-card
 *   label="Approval Rate"
 *   value="78.5%"
 *   [trendDirection]="null">
 * </app-planning-kpi-card>
 * ```
 */
@Component({
  selector: 'app-planning-kpi-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div class="card-body p-5 flex flex-col items-center justify-center text-center gap-2">
        <!-- Metric value displayed prominently -->
        <div class="flex items-baseline gap-1">
          <span class="text-3xl font-bold text-base-content">{{ value }}</span>
          <span
            *ngIf="unit"
            class="text-sm font-medium text-base-content/60">
            {{ unit }}
          </span>
        </div>

        <!-- Label below the value -->
        <span class="text-sm font-medium text-base-content/60">{{ label }}</span>

        <!-- Optional trend indicator -->
        <div
          *ngIf="trendDirection"
          class="mt-1 flex items-center gap-1 text-sm"
          [ngClass]="trendColorClass"
          [attr.aria-label]="trendAriaLabel"
          role="img">
          <span class="material-symbols-outlined text-base">{{ trendIcon }}</span>
          <span class="font-medium">{{ trendLabel }}</span>
        </div>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  /** The metric label displayed below the value. */
  @Input({ required: true }) label = '';

  /** The formatted metric value to display prominently. Accepts string or number. */
  @Input({ required: true }) value: string | number = '';

  /** Optional unit suffix displayed next to the value (e.g., "days", "%"). */
  @Input() unit: string | null = null;

  /** Optional trend direction indicator arrow. */
  @Input() trendDirection: KpiTrendDirection | null = null;

  /** Returns the appropriate CSS class for the trend direction colour. */
  get trendColorClass(): string {
    switch (this.trendDirection) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      case 'flat':
        return 'text-base-content/50';
      default:
        return '';
    }
  }

  /** Returns the Material Symbols icon name for the trend direction. */
  get trendIcon(): string {
    switch (this.trendDirection) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      case 'flat':
        return 'trending_flat';
      default:
        return '';
    }
  }

  /** Returns a human-readable trend label. */
  get trendLabel(): string {
    switch (this.trendDirection) {
      case 'up':
        return 'Trending up';
      case 'down':
        return 'Trending down';
      case 'flat':
        return 'No change';
      default:
        return '';
    }
  }

  /** Returns an accessible label describing the trend for screen readers. */
  get trendAriaLabel(): string {
    switch (this.trendDirection) {
      case 'up':
        return 'Metric is trending upward';
      case 'down':
        return 'Metric is trending downward';
      case 'flat':
        return 'Metric is unchanged';
      default:
        return '';
    }
  }
}
