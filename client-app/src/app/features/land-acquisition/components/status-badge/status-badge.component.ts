import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpportunityStatus } from '../../models';

/**
 * Colour mapping for opportunity statuses following the UX colour system:
 * Green = Success (Acquired), Blue = Information (InitialReview, OfferMade),
 * Amber = Warning (DueDiligence, UnderContract), Red = Critical (Withdrawn),
 * Grey = Neutral (Identified).
 */
const STATUS_BADGE_CONFIG: Record<OpportunityStatus, { label: string; cssClass: string }> = {
  [OpportunityStatus.Identified]: {
    label: 'Identified',
    cssClass: 'badge-ghost'
  },
  [OpportunityStatus.InitialReview]: {
    label: 'Initial Review',
    cssClass: 'badge-info'
  },
  [OpportunityStatus.DueDiligence]: {
    label: 'Due Diligence',
    cssClass: 'badge-warning'
  },
  [OpportunityStatus.OfferMade]: {
    label: 'Offer Made',
    cssClass: 'badge-info'
  },
  [OpportunityStatus.UnderContract]: {
    label: 'Under Contract',
    cssClass: 'badge-warning'
  },
  [OpportunityStatus.Acquired]: {
    label: 'Acquired',
    cssClass: 'badge-success'
  },
  [OpportunityStatus.Withdrawn]: {
    label: 'Withdrawn',
    cssClass: 'badge-error'
  }
};

/**
 * Presentational component that renders a colored DaisyUI badge
 * based on the current OpportunityStatus value.
 *
 * Usage:
 * ```html
 * <app-status-badge [status]="opportunity.status"></app-status-badge>
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
      [attr.aria-label]="'Status: ' + label"
      role="status">
      {{ label }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input({ required: true }) status!: OpportunityStatus;

  get label(): string {
    return STATUS_BADGE_CONFIG[this.status]?.label ?? this.status;
  }

  get badgeClass(): string {
    return STATUS_BADGE_CONFIG[this.status]?.cssClass ?? 'badge-ghost';
  }
}
