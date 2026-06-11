import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Trend direction for KPI card indicator.
 */
export type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Trend data for the KPI card.
 */
export interface IKpiTrend {
  readonly direction: TrendDirection;
  readonly value: string;
}

/**
 * KpiCardComponent — A presentational component that displays a single KPI metric
 * with label, value, icon, and an optional trend indicator.
 *
 * Uses DaisyUI card styling with Tailwind utility classes.
 * Designed for use on the Land Acquisition Dashboard (Requirement 18.1).
 *
 * @example
 * ```html
 * <app-kpi-card
 *   label="Avg. Acquisition Cycle"
 *   value="45 days"
 *   icon="schedule"
 *   [trend]="{ direction: 'down', value: '12%' }">
 * </app-kpi-card>
 * ```
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card bg-base-100 shadow-sm border border-base-200 h-full">
      <div class="card-body p-5">
        <div class="flex items-start justify-between">
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-base-content/60">{{ label }}</span>
            <span class="text-2xl font-bold text-base-content">{{ value }}</span>
          </div>
          <div
            class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary"
            [attr.aria-hidden]="true">
            <span class="material-symbols-outlined text-xl">{{ icon }}</span>
          </div>
        </div>

        <div
          *ngIf="trend"
          class="mt-3 flex items-center gap-1 text-sm"
          [ngClass]="trendColorClass"
          [attr.aria-label]="trendAriaLabel">
          <span class="material-symbols-outlined text-base">{{ trendIcon }}</span>
          <span class="font-medium">{{ trend.value }}</span>
        </div>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  /** The metric label displayed above the value. */
  @Input({ required: true }) label = '';

  /** The formatted metric value to display prominently. */
  @Input({ required: true }) value = '';

  /** Material Symbols icon name for the metric. */
  @Input({ required: true }) icon = '';

  /** Optional trend indicator showing direction and percentage change. */
  @Input() trend: IKpiTrend | null = null;

  /** Returns the appropriate CSS class for the trend direction. */
  get trendColorClass(): string {
    if (!this.trend) return '';
    switch (this.trend.direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      case 'neutral':
        return 'text-base-content/50';
    }
  }

  /** Returns the appropriate icon for the trend direction. */
  get trendIcon(): string {
    if (!this.trend) return '';
    switch (this.trend.direction) {
      case 'up':
        return 'trending_up';
      case 'down':
        return 'trending_down';
      case 'neutral':
        return 'trending_flat';
    }
  }

  /** Returns an accessible label describing the trend. */
  get trendAriaLabel(): string {
    if (!this.trend) return '';
    const direction = this.trend.direction === 'up' ? 'increased' :
                      this.trend.direction === 'down' ? 'decreased' : 'unchanged';
    return `Trend: ${direction} by ${this.trend.value}`;
  }
}
