import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IInsuranceRecordListItem, InsuranceStatus } from '../../models/insurance-record.model';

/**
 * InsuranceAlertCardComponent — Presentational component that displays an insurance
 * record as an alert card with urgency styling based on days until expiry.
 *
 * Shows: Policy number, insurer, expiry date, days until expiry, and status.
 * Urgency styling:
 * - Expired (< 0 days): error/red border
 * - Expiring soon (< 30 days): warning/amber border
 * - Active (>= 30 days): normal border
 *
 * @example
 * ```html
 * <app-insurance-alert-card
 *   [insuranceRecord]="record"
 *   (cardClick)="onInsuranceSelected($event)">
 * </app-insurance-alert-card>
 * ```
 */
@Component({
  selector: 'app-insurance-alert-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="card card-compact bg-base-100 border transition-all duration-200
             hover:shadow-md cursor-pointer"
      [ngClass]="getCardBorderClass()"
      role="button"
      tabindex="0"
      [attr.aria-label]="'Insurance policy: ' + insuranceRecord.policyNumber"
      (click)="onCardClick()"
      (keydown.enter)="onCardClick()"
      (keydown.space)="onCardClick(); $event.preventDefault()"
    >
      <div class="card-body p-4 space-y-2">
        <!-- Header: Policy number + Status badge -->
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold font-mono text-base-content">
            {{ insuranceRecord.policyNumber }}
          </span>
          <span class="badge badge-xs" [ngClass]="getStatusBadgeClass()">
            {{ formatStatus(insuranceRecord.status) }}
          </span>
        </div>

        <!-- Insurer -->
        <p class="text-sm text-base-content/80 truncate" [title]="insuranceRecord.insurer">
          {{ insuranceRecord.insurer }}
        </p>

        <!-- Expiry Date + Days until expiry -->
        <div class="flex items-center justify-between pt-1 border-t border-base-200">
          <span class="text-xs text-base-content/60">
            Expires: {{ insuranceRecord.expiryDate | date:'dd MMM yyyy' }}
          </span>
          <span
            class="text-xs font-semibold"
            [ngClass]="getDaysUntilExpiryClass()"
          >
            {{ getDaysUntilExpiryLabel() }}
          </span>
        </div>
      </div>
    </div>
  `
})
export class InsuranceAlertCardComponent {
  /** The insurance record list item to display. */
  @Input({ required: true }) insuranceRecord!: IInsuranceRecordListItem;

  /** Emits when the card is clicked. */
  @Output() cardClick = new EventEmitter<IInsuranceRecordListItem>();

  onCardClick(): void {
    this.cardClick.emit(this.insuranceRecord);
  }

  /** Calculates the number of days until the policy expires. Negative means expired. */
  getDaysUntilExpiry(): number {
    const expiry = new Date(this.insuranceRecord.expiryDate);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /** Returns label text for days until expiry. */
  getDaysUntilExpiryLabel(): string {
    const days = this.getDaysUntilExpiry();
    if (days < 0) {
      return `Expired ${Math.abs(days)}d ago`;
    }
    if (days === 0) {
      return 'Expires today';
    }
    return `${days}d remaining`;
  }

  /** Returns colour class based on days until expiry. */
  getDaysUntilExpiryClass(): string {
    const days = this.getDaysUntilExpiry();
    if (days < 0) {
      return 'text-error';
    }
    if (days < 30) {
      return 'text-warning';
    }
    return 'text-success';
  }

  /** Returns card border class based on urgency. */
  getCardBorderClass(): string {
    const days = this.getDaysUntilExpiry();
    if (days < 0) {
      return 'border-error/50 bg-error/5';
    }
    if (days < 30) {
      return 'border-warning/50 bg-warning/5';
    }
    return 'border-base-200';
  }

  /** Returns DaisyUI badge class based on insurance status. */
  getStatusBadgeClass(): string {
    switch (this.insuranceRecord.status) {
      case InsuranceStatus.Active:
        return 'badge-success';
      case InsuranceStatus.ExpiringSoon:
        return 'badge-warning';
      case InsuranceStatus.Expired:
        return 'badge-error';
      case InsuranceStatus.Renewed:
        return 'badge-info';
      case InsuranceStatus.Cancelled:
        return 'badge-neutral';
      case InsuranceStatus.Closed:
        return 'badge-ghost';
      default:
        return 'badge-ghost';
    }
  }

  /** Formats PascalCase status to a readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }
}
