import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Event payload emitted when a transition is selected.
 */
export interface IStatusTransitionEvent {
  readonly newStatus: string;
  readonly entityType: string;
}

/**
 * StatusTransitionDialogComponent — A modal dialog for selecting a status transition.
 *
 * Displays the current status, entity type context, and a list of permitted transitions
 * the user can choose from. Uses DaisyUI modal styling.
 *
 * The parent component is responsible for showing/hiding the dialog via the `open` input.
 *
 * @example
 * ```html
 * <app-status-transition-dialog
 *   [open]="showDialog"
 *   [currentStatus]="case.status"
 *   [permittedTransitions]="['InProgress', 'OnHold']"
 *   entityType="Legal Case"
 *   (transitionSelected)="onTransition($event)"
 *   (dialogClosed)="showDialog = false">
 * </app-status-transition-dialog>
 * ```
 */
@Component({
  selector: 'app-status-transition-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="modal"
      [ngClass]="{ 'modal-open': open }"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="'Change ' + entityType + ' status'"
    >
      <div class="modal-box max-w-md">
        <!-- Header -->
        <h3 class="font-bold text-lg">Change {{ entityType }} Status</h3>
        <p class="text-sm text-base-content/60 mt-1">
          Current status:
          <span class="badge badge-sm badge-outline ml-1">{{ formatStatus(currentStatus) }}</span>
        </p>

        <!-- Transition Options -->
        <div class="mt-4 space-y-2" *ngIf="permittedTransitions.length > 0; else noTransitions">
          <p class="text-sm font-medium text-base-content/70 mb-2">Select new status:</p>
          <button
            *ngFor="let transition of permittedTransitions; trackBy: trackByStatus"
            class="btn btn-outline btn-sm btn-block justify-start gap-2"
            (click)="onTransitionSelect(transition)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {{ formatStatus(transition) }}
          </button>
        </div>

        <ng-template #noTransitions>
          <div class="mt-4 text-center py-4 text-base-content/50">
            <p class="text-sm">No transitions available from the current status.</p>
          </div>
        </ng-template>

        <!-- Footer -->
        <div class="modal-action">
          <button
            class="btn btn-sm btn-ghost"
            (click)="onClose()"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- Backdrop -->
      <div class="modal-backdrop" (click)="onClose()"></div>
    </div>
  `
})
export class StatusTransitionDialogComponent {
  /** Whether the dialog is open. */
  @Input() open = false;

  /** The current status value. */
  @Input({ required: true }) currentStatus = '';

  /** List of permitted status transitions from the current state. */
  @Input({ required: true }) permittedTransitions: readonly string[] = [];

  /** The entity type label (e.g., 'Legal Case', 'Contract', 'Insurance'). */
  @Input({ required: true }) entityType = '';

  /** Emits when a transition is selected. */
  @Output() transitionSelected = new EventEmitter<IStatusTransitionEvent>();

  /** Emits when the dialog is closed without selecting a transition. */
  @Output() dialogClosed = new EventEmitter<void>();

  onTransitionSelect(newStatus: string): void {
    this.transitionSelected.emit({ newStatus, entityType: this.entityType });
  }

  onClose(): void {
    this.dialogClosed.emit();
  }

  /** Formats PascalCase status to a readable label. */
  formatStatus(status: string): string {
    return status
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .trim();
  }

  /** TrackBy function for the transitions list. */
  trackByStatus(_index: number, status: string): string {
    return status;
  }
}
