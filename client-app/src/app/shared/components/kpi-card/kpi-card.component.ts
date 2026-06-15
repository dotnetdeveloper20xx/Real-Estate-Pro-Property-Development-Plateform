import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Trend direction for KPI card indicator.
 */
export type TrendDirection = 'up' | 'down' | 'neutral' | 'flat';

/**
 * Trend data for the KPI card.
 */
export interface IKpiTrend {
  readonly direction: TrendDirection;
  readonly value?: string;
}

/**
 * Unified KpiCardComponent — A presentational component that displays a single KPI metric
 * with label, value, optional icon, optional unit suffix, and optional trend indicator.
 *
 * Consolidates KPI card variants from:
 * - Land Acquisition (icon, label, value, trend with direction + value string)
 * - Planning Approvals (label, value, unit, trendDirection)
 * - Legal Compliance (icon, label, value, trend direction)
 *
 * Uses DaisyUI card styling with Tailwind utility classes.
 *
 * @example
 * ```html
 * <!-- Full usage with icon and trend -->
 * <app-kpi-card
 *   label="Avg. Acquisition Cycle"
 *   value="45 days"
 *   icon="schedule"
 *   [trend]="{ direction: 'down', value: '12%' }">
 * </app-kpi-card>
 *
 * <!-- With unit suffix -->
 * <app-kpi-card
 *   label="Average Decision Time"
 *   [value]="45"
 *   unit="days"
 *   [trend]="{ direction: 'down' }">
 * </app-kpi-card>
 *
 * <!-- Minimal usage -->
 * <app-kpi-card label="Open Cases" [value]="42" icon="folder_open">
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
            <div class="flex items-baseline gap-1">
              <span class="text-2xl font-bold text-base-content">{{ value }}</span>
              <span
                *ngIf="unit"
                class="text-sm font-medium text-base-content/60">
                {{ unit }}
              </span>
            </div>
          </div>
          <div
            *ngIf="icon"
            class="flex items-center justify-center w-10 h-10 rounded-lg text-primary"
            [ngClass]="iconBgClass"
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
          <span class="font-medium">{{ trendDisplayValue }}</span>
        </div>
      </div>
    </div>
  `
})
export class KpiCardComponent {
  /** The metric label displayed above the value. */
  @Input({ required: true }) label = '';

  /** The formatted metric value to display prominently. Accepts string or number. */
  @Input({ required: true }) value: string | number = '';

  /** Optional Material Symbols icon name for the metric. */
  @Input() icon: string | null = null;

  /** Optional unit suffix displayed next to the value (e.g., "days", "%"). */
  @Input() unit: string | null = null;

  /** Optional trend indicator showing direction and percentage change. */
  @Input() trend: IKpiTrend | null = null;

  /** Optional CSS class for the icon background. Defaults to 'bg-primary/10'. */
  @Input() iconBgClass = 'bg-primary/10';

  /** Returns the appropriate CSS class for the trend direction. */
  get trendColorClass(): string {
    if (!this.trend) return '';
    switch (this.trend.direction) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-error';
      case 'neutral':
      case 'flat':
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
      case 'flat':
        return 'trending_flat';
    }
  }

  /** Returns the display text for the trend. */
  get trendDisplayValue(): string {
    if (!this.trend) return '';
    if (this.trend.value) return this.trend.value;
    switch (this.trend.direction) {
      case 'up':
        return 'Trending up';
      case 'down':
        return 'Trending down';
      case 'neutral':
      case 'flat':
        return 'No change';
    }
  }

  /** Returns an accessible label describing the trend. */
  get trendAriaLabel(): string {
    if (!this.trend) return '';
    const direction = this.trend.direction === 'up' ? 'increased' :
                      this.trend.direction === 'down' ? 'decreased' : 'unchanged';
    const suffix = this.trend.value ? ` by ${this.trend.value}` : '';
    return `Trend: ${direction}${suffix}`;
  }
}
