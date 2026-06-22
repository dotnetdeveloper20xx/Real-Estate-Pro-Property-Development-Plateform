import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { StatusBadgeComponent as DsStatusBadgeComponent } from '../../../../shared/design-system/badges/status-badge/status-badge.component';
import { IBadgeMapEntry } from '../../../../shared/design-system/badges/base-badge.component';
import { OpportunityStatus } from '../../models';

/**
 * Opportunity status badge — thin wrapper around the design system StatusBadgeComponent
 * that provides an OpportunityStatus-specific badge map.
 *
 * Colour mapping follows the UX colour system:
 * Green = Success (Acquired), Blue = Information (InitialReview, OfferMade),
 * Amber = Warning (DueDiligence, UnderContract), Red = Critical (Withdrawn),
 * Grey = Neutral (Identified).
 *
 * Usage:
 * ```html
 * <app-opportunity-status-badge [status]="opportunity.status" />
 * ```
 */

const OPPORTUNITY_BADGE_MAP: Record<string, IBadgeMapEntry> = {
  [OpportunityStatus.Identified]: { label: 'Identified', cssClass: 'badge-ghost' },
  [OpportunityStatus.InitialReview]: { label: 'Initial Review', cssClass: 'badge-info' },
  [OpportunityStatus.DueDiligence]: { label: 'Due Diligence', cssClass: 'badge-warning' },
  [OpportunityStatus.OfferMade]: { label: 'Offer Made', cssClass: 'badge-info' },
  [OpportunityStatus.UnderContract]: { label: 'Under Contract', cssClass: 'badge-warning' },
  [OpportunityStatus.Acquired]: { label: 'Acquired', cssClass: 'badge-success' },
  [OpportunityStatus.Withdrawn]: { label: 'Withdrawn', cssClass: 'badge-error' },
};

@Component({
  selector: 'app-opportunity-status-badge',
  standalone: true,
  imports: [DsStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-status-badge
      [value]="status"
      [badgeMap]="badgeMap"
      size="sm" />
  `
})
export class OpportunityStatusBadgeComponent {
  @Input({ required: true }) status!: OpportunityStatus;

  readonly badgeMap = OPPORTUNITY_BADGE_MAP;
}
