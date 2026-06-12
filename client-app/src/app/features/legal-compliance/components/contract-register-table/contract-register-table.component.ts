import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IContractListItem, LegalContractStatus } from '../../models/contract.model';

/**
 * ContractRegisterTableComponent — A presentational data table component for
 * displaying the contract register. Uses DaisyUI table styling.
 *
 * Displays: Contract Reference, Title, Type, Status, Counterparty, Value,
 * Start Date, End Date, and linked Case Reference.
 *
 * @example
 * ```html
 * <app-contract-register-table
 *   [contracts]="contractList"
 *   (rowClick)="onContractSelected($event)">
 * </app-contract-register-table>
 * ```
 */
@Component({
  selector: 'app-contract-register-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="contracts.length > 0; else emptyState" class="overflow-x-auto">
      <table class="table table-sm" role="grid" aria-label="Contract register">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Counterparty</th>
            <th class="text-right">Value</th>
            <th>Start</th>
            <th>End</th>
            <th>Case Ref</th>
          </tr>
        </thead>
        <tbody>
          <tr
            *ngFor="let contract of contracts; trackBy: trackById"
            class="hover cursor-pointer"
            tabindex="0"
            (click)="onRowClick(contract)"
            (keydown.enter)="onRowClick(contract)"
          >
            <td class="font-mono text-xs">{{ contract.contractReference }}</td>
            <td class="max-w-[200px] truncate" [title]="contract.title">
              {{ contract.title }}
            </td>
            <td>
              <span class="badge badge-outline badge-xs">
                {{ formatType(contract.contractType) }}
              </span>
            </td>
            <td>
              <span class="badge badge-xs" [ngClass]="getStatusBadgeClass(contract.status)">
                {{ formatStatus(contract.status) }}
              </span>
            </td>
            <td class="max-w-[150px] truncate" [title]="contract.counterpartyName">
              {{ contract.counterpartyName }}
            </td>
            <td class="text-right font-mono text-sm">
              {{ contract.currency }} {{ contract.contractValue | number:'1.0-0' }}
            </td>
            <td class="text-xs">{{ contract.startDate | date:'dd MMM yyyy' }}</td>
            <td class="text-xs">{{ contract.endDate | date:'dd MMM yyyy' }}</td>
            <td class="font-mono text-xs">{{ contract.caseReference }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ng-template #emptyState>
      <div class="text-center py-8 text-base-content/50">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="font-medium">No contracts found</p>
        <p class="text-sm mt-1">Contracts will appear here once they are created.</p>
      </div>
    </ng-template>
  `
})
export class ContractRegisterTableComponent {
  /** Array of contract list items to display in the table. */
  @Input({ required: true }) contracts: readonly IContractListItem[] = [];

  /** Emits when a table row is clicked. */
  @Output() rowClick = new EventEmitter<IContractListItem>();

  onRowClick(contract: IContractListItem): void {
    this.rowClick.emit(contract);
  }

  /** Formats PascalCase enum value to a readable label. */
  formatType(type: string): string {
    return type
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Formats PascalCase status to a readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** Returns DaisyUI badge class based on contract status. */
  getStatusBadgeClass(status: LegalContractStatus): string {
    switch (status) {
      case LegalContractStatus.Draft:
        return 'badge-neutral';
      case LegalContractStatus.UnderReview:
        return 'badge-info';
      case LegalContractStatus.Approved:
        return 'badge-success';
      case LegalContractStatus.AwaitingSignature:
        return 'badge-warning';
      case LegalContractStatus.Executed:
        return 'badge-primary';
      case LegalContractStatus.Active:
        return 'badge-success';
      case LegalContractStatus.Completed:
        return 'badge-accent';
      case LegalContractStatus.Terminated:
        return 'badge-error';
      case LegalContractStatus.Expired:
        return 'badge-warning';
      case LegalContractStatus.UnderDispute:
        return 'badge-error';
      case LegalContractStatus.Cancelled:
        return 'badge-neutral';
      case LegalContractStatus.Rejected:
        return 'badge-error';
      case LegalContractStatus.Closed:
        return 'badge-ghost';
      case LegalContractStatus.Renewed:
        return 'badge-info';
      default:
        return 'badge-ghost';
    }
  }

  /** TrackBy function for ngFor. */
  trackById(_index: number, item: IContractListItem): string {
    return item.id;
  }
}
