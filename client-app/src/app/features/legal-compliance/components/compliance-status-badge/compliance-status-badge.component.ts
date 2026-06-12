import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Valid status colour values for the compliance status badge.
 */
export type ComplianceStatusColor = 'green' | 'amber' | 'red' | 'grey';

/**
 * ComplianceStatusBadgeComponent — A reusable presentational component that renders
 * a colour-coded dot/badge to indicate compliance status.
 *
 * Colour mapping follows the UX Governance Board colour system:
 * - green: Compliant / Success
 * - amber: Warning / Partially Compliant
 * - red: Critical / Non-Compliant
 * - grey: Neutral / Not Applicable
 *
 * @example
 * ```html
 * <app-compliance-status-badge statusColor="green"></app-compliance-status-badge>
 * <app-compliance-status-badge statusColor="red" [showLabel]="true"></app-compliance-status-badge>
 * ```
 */
@Component({
  selector: 'app-compliance-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center gap-1.5"
      [attr.aria-label]="ariaLabel"
      role="status"
    >
      <span
        class="w-2.5 h-2.5 rounded-full shrink-0"
        [ngClass]="dotClass"
      ></span>
      <span
        *ngIf="showLabel"
        class="text-xs font-medium"
        [ngClass]="labelClass"
      >
        {{ statusLabel }}
      </span>
    </span>
  `
})
export class ComplianceStatusBadgeComponent {
  /** The status colour indicator: 'green', 'amber', 'red', or 'grey'. */
  @Input({ required: true }) statusColor: ComplianceStatusColor = 'grey';

  /** Whether to display the text label alongside the dot. Defaults to false. */
  @Input() showLabel = false;

  /** Returns the CSS class for the coloured dot. */
  get dotClass(): string {
    switch (this.statusColor) {
      case 'green':
        return 'bg-success';
      case 'amber':
        return 'bg-warning';
      case 'red':
        return 'bg-error';
      case 'grey':
      default:
        return 'bg-base-300';
    }
  }

  /** Returns the CSS class for the label text. */
  get labelClass(): string {
    switch (this.statusColor) {
      case 'green':
        return 'text-success';
      case 'amber':
        return 'text-warning';
      case 'red':
        return 'text-error';
      case 'grey':
      default:
        return 'text-base-content/50';
    }
  }

  /** Returns a human-readable label for the status. */
  get statusLabel(): string {
    switch (this.statusColor) {
      case 'green':
        return 'Compliant';
      case 'amber':
        return 'Warning';
      case 'red':
        return 'Non-Compliant';
      case 'grey':
      default:
        return 'N/A';
    }
  }

  /** Returns an accessible label for screen readers. */
  get ariaLabel(): string {
    return `Compliance status: ${this.statusLabel}`;
  }
}
