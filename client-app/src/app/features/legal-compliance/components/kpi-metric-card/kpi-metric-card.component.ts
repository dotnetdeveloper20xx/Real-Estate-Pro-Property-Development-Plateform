import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Trend direction for the KPI metric card indicator.
 */
export type KpiTrendDirection = 'up' | 'down' | 'flat';

/**
 * KpiMetricCardComponent — A reusable presentational component that displays a single
 * KPI metric with a prominent value, label, optional icon, and optional trend indicator.
 *
 * Uses DaisyUI card styling with Tailwind utility classes.
 *
 * @example
 * ```html
 * <app-kpi-metric-card
 *   label="Open Cases"
 *   [value]="42"
 *   icon="folder_open"
 *   trend="up">
 * </app-kpi-metric-card>
 * ```
 */
@Component({
  selector: 'app-kpi-metric-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div class="card-body p-5 flex flex-col items-center justify-center text-center gap-2">
        <!-- Optional icon -->
        <span
          *ngIf="icon"
          class="material-symbols-outlined text-2xl text-primary/70"
          aria-hidden="true">
          {{ icon }}
        </span>

        <!-- Metric value displayed prominently -->
        <span class="text-3xl font-bold text-base-content">{{ value }}</span>

        <!-- Label below the value -->
        <span class="text-sm font-medium text-base-content/60">{{ label }}</span>

        <!-- Optional trend indicator -->
        <div
          *ngIf="trend"
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
export class KpiMetricCardComponent {
  /** The metric label displayed below the value. */
  @Input({ required: true }) label = '';

  /** The metric value to display prominently. Accepts string or number. */
  @Input({ required: true }) value: string | number = '';

  /** Optional Material Symbols icon name (e.g., 'folder_open', 'gavel'). */
  @Input() icon: string | null = null;

  /** Optional trend direction indicator. */
  @Input() trend: KpiTrendDirection | null = null;

  /** Returns the appropriate CSS class for the trend direction colour. */
  get trendColorClass(): string {
    switch (this.trend) {
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
    switch (this.trend) {
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
    switch (this.trend) {
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
    switch (this.trend) {
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
