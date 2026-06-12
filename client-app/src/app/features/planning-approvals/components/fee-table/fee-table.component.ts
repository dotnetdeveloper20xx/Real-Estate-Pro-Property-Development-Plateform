import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPlanningFee } from '../../models/planning-fee.model';

/**
 * FeeTableComponent — A presentational component that displays planning fees
 * in a DaisyUI table with type/status badges and a totals summary row.
 *
 * Columns: Description, Type (badge), Amount, Currency, Status (badge).
 * Footer row shows total amount.
 *
 * Requirements: 15.2
 *
 * @example
 * ```html
 * <app-fee-table
 *   [fees]="fees"
 *   (feeSelect)="onFeeSelect($event)">
 * </app-fee-table>
 * ```
 */
@Component({
  selector: 'app-fee-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-x-auto" role="region" aria-label="Fees table">
      <table class="table table-sm w-full" *ngIf="fees.length > 0; else emptyState">
        <thead>
          <tr>
            <th>Description</th>
            <th>Type</th>
            <th class="text-right">Amount</th>
            <th>Currency</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            *ngFor="let fee of fees; trackBy: trackById"
            class="hover cursor-pointer"
            (click)="feeSelect.emit(fee)"
            (keydown.enter)="feeSelect.emit(fee)"
            tabindex="0"
            [attr.aria-label]="fee.description + ' — ' + fee.amount + ' ' + fee.currency"
          >
            <td class="max-w-xs truncate" [title]="fee.description">
              {{ fee.description }}
            </td>
            <td>
              <span class="badge badge-sm" [ngClass]="getTypeBadgeClass(fee.feeType)">
                {{ formatFeeType(fee.feeType) }}
              </span>
            </td>
            <td class="text-right font-mono text-sm">
              {{ fee.amount | number:'1.2-2' }}
            </td>
            <td class="text-sm">{{ fee.currency }}</td>
            <td>
              <span class="badge badge-sm" [ngClass]="getStatusBadgeClass(fee.paymentStatus)">
                {{ formatStatus(fee.paymentStatus) }}
              </span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="font-semibold bg-base-200/50">
            <td colspan="2" class="text-right">Total</td>
            <td class="text-right font-mono">{{ totalAmount | number:'1.2-2' }}</td>
            <td>{{ primaryCurrency }}</td>
            <td>
              <span class="text-xs text-base-content/60">{{ fees.length }} item{{ fees.length !== 1 ? 's' : '' }}</span>
            </td>
          </tr>
        </tfoot>
      </table>

      <ng-template #emptyState>
        <div class="text-center py-8 text-base-content/50">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="font-medium">No fees recorded</p>
          <p class="text-sm mt-1">Fees will appear here when they are added to this application.</p>
        </div>
      </ng-template>
    </div>
  `
})
export class FeeTableComponent {
  /** Array of planning fees to display. */
  @Input({ required: true }) fees: readonly IPlanningFee[] = [];

  /** Emits when a fee row is clicked for detail view or action. */
  @Output() feeSelect = new EventEmitter<IPlanningFee>();

  /** Calculates the total amount across all fees. */
  get totalAmount(): number {
    return this.fees.reduce((sum, fee) => sum + fee.amount, 0);
  }

  /** Returns the most common currency, defaulting to GBP. */
  get primaryCurrency(): string {
    if (this.fees.length === 0) {
      return 'GBP';
    }
    return this.fees[0].currency || 'GBP';
  }

  /** Returns the DaisyUI badge class for a fee type. */
  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'ApplicationFee':
        return 'badge-primary';
      case 'PreApplicationFee':
        return 'badge-secondary';
      case 'ConditionDischargeFee':
        return 'badge-accent';
      case 'AppealFee':
        return 'badge-warning';
      case 'SupplementaryFee':
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  }

  /** Returns the DaisyUI badge class for a payment status. */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'badge-neutral';
      case 'AwaitingApproval':
        return 'badge-warning';
      case 'Approved':
        return 'badge-info';
      case 'Rejected':
        return 'badge-error';
      case 'Paid':
        return 'badge-success';
      default:
        return 'badge-ghost';
    }
  }

  /** Formats PascalCase fee type to readable label. */
  formatFeeType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** Formats PascalCase payment status to readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  }

  /** TrackBy function for ngFor. */
  trackById(_index: number, item: IPlanningFee): string {
    return item.id;
  }
}
