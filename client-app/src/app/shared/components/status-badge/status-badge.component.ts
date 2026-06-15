import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Badge map entry defining the display label and CSS class for a status value.
 */
export interface IBadgeMapEntry {
  readonly label: string;
  readonly cssClass: string;
}

/**
 * Unified StatusBadgeComponent — A generic, configurable presentational component
 * that renders a colored DaisyUI badge based on a status value.
 *
 * Accepts a configurable badge map (value → CSS class + label) so any module
 * can define its own status-to-badge mapping.
 *
 * If no badgeMap is provided, the raw value is displayed with `badge-ghost` styling.
 *
 * @example
 * ```html
 * <!-- With a custom badge map -->
 * <app-status-badge
 *   [value]="opportunity.status"
 *   [badgeMap]="statusBadgeConfig">
 * </app-status-badge>
 *
 * <!-- Without badge map — renders raw value with ghost styling -->
 * <app-status-badge [value]="'Active'"></app-status-badge>
 * ```
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="badge badge-sm font-medium"
      [ngClass]="badgeClass"
      [attr.aria-label]="'Status: ' + displayLabel"
      role="status">
      {{ displayLabel }}
    </span>
  `
})
export class StatusBadgeComponent {
  /** The status value to render. */
  @Input({ required: true }) value = '';

  /**
   * Optional mapping from status values to display labels and CSS classes.
   * Keys should match possible `value` inputs.
   */
  @Input() badgeMap: Record<string, IBadgeMapEntry> | null = null;

  /** Returns the display label from the badge map or the raw value. */
  get displayLabel(): string {
    if (this.badgeMap && this.badgeMap[this.value]) {
      return this.badgeMap[this.value].label;
    }
    return this.formatValue(this.value);
  }

  /** Returns the CSS class from the badge map or falls back to badge-ghost. */
  get badgeClass(): string {
    if (this.badgeMap && this.badgeMap[this.value]) {
      return this.badgeMap[this.value].cssClass;
    }
    return 'badge-ghost';
  }

  /**
   * Formats a PascalCase or camelCase string into a human-readable label.
   */
  private formatValue(val: string): string {
    if (!val) return '';
    return val
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }
}
