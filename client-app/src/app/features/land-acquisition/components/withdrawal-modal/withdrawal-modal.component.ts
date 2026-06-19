import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  SimpleChanges,
  OnChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Standalone DaisyUI modal component for collecting withdrawal reasons.
 * Replaces the previous `window.prompt()` usage with a proper enterprise modal dialog.
 *
 * Features:
 * - Textarea with character counter (current / minimum 10)
 * - Confirm button disabled until reason meets minimum length
 * - Warning message about irreversibility of withdrawal
 * - Cancel and Confirm Withdrawal buttons
 *
 * Usage:
 * ```html
 * <app-withdrawal-modal
 *   [visible]="showWithdrawalModal"
 *   (confirmed)="onWithdrawalConfirmed($event)"
 *   (cancelled)="onWithdrawalCancelled()">
 * </app-withdrawal-modal>
 * ```
 */
@Component({
  selector: 'app-withdrawal-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #modalDialog
      class="modal"
      [class.modal-open]="visible"
      role="dialog"
      aria-labelledby="withdrawal-modal-title"
      aria-describedby="withdrawal-modal-description"
      aria-modal="true">
      <div class="modal-box max-w-md">
        <!-- Header -->
        <h3 id="withdrawal-modal-title" class="font-bold text-lg flex items-center gap-2">
          <span class="material-icons text-error">warning</span>
          Withdraw Opportunity
        </h3>

        <!-- Warning message about irreversibility -->
        <div
          id="withdrawal-modal-description"
          class="alert alert-warning mt-4"
          role="alert">
          <span class="material-icons text-warning">info</span>
          <span>This action is irreversible. Once withdrawn, the opportunity cannot be reopened or moved back to an active status.</span>
        </div>

        <!-- Reason textarea -->
        <div class="form-control mt-4">
          <label class="label" for="withdrawal-reason">
            <span class="label-text font-medium">Reason for withdrawal <span class="text-error">*</span></span>
          </label>
          <textarea
            id="withdrawal-reason"
            class="textarea textarea-bordered w-full h-28 resize-none"
            [class.textarea-error]="reason.trim().length > 0 && reason.trim().length < minimumLength"
            placeholder="Please explain why this opportunity is being withdrawn..."
            [(ngModel)]="reason"
            [attr.aria-invalid]="reason.trim().length > 0 && reason.trim().length < minimumLength"
            aria-describedby="reason-counter reason-hint"
            maxlength="500">
          </textarea>
          <div class="label justify-between">
            <span
              id="reason-hint"
              class="label-text-alt"
              [class.text-error]="reason.trim().length > 0 && reason.trim().length < minimumLength">
              <span *ngIf="reason.trim().length > 0 && reason.trim().length < minimumLength">
                Minimum {{ minimumLength }} characters required
              </span>
            </span>
            <span
              id="reason-counter"
              class="label-text-alt"
              [class.text-error]="reason.trim().length > 0 && reason.trim().length < minimumLength"
              [class.text-success]="reason.trim().length >= minimumLength">
              {{ reason.trim().length }} / {{ minimumLength }}
            </span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="modal-action">
          <button
            type="button"
            class="btn btn-ghost"
            (click)="onCancel()"
            aria-label="Cancel withdrawal">
            Cancel
          </button>
          <button
            type="button"
            class="btn btn-error"
            [disabled]="!isValid"
            (click)="onConfirm()"
            aria-label="Confirm withdrawal">
            <span class="material-icons text-sm">cancel</span>
            Confirm Withdrawal
          </button>
        </div>
      </div>

      <!-- Backdrop click to cancel -->
      <form method="dialog" class="modal-backdrop">
        <button type="button" (click)="onCancel()" aria-label="Close modal">close</button>
      </form>
    </dialog>
  `
})
export class WithdrawalModalComponent implements OnChanges {
  /** Controls modal visibility */
  @Input() visible = false;

  /** Emits the trimmed withdrawal reason text on confirm */
  @Output() confirmed = new EventEmitter<string>();

  /** Emits when the user cancels the dialog */
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('modalDialog') modalDialog!: ElementRef<HTMLDialogElement>;

  /** Minimum character count for a valid withdrawal reason */
  readonly minimumLength = 10;

  /** Current reason text entered by the user */
  reason = '';

  /** Whether the current reason passes validation */
  get isValid(): boolean {
    return this.reason.trim().length >= this.minimumLength;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      if (this.visible) {
        // Reset the form when the modal is opened
        this.reason = '';
      }
    }
  }

  /** Handle confirm button click */
  onConfirm(): void {
    if (!this.isValid) return;
    this.confirmed.emit(this.reason.trim());
    this.reason = '';
  }

  /** Handle cancel button or backdrop click */
  onCancel(): void {
    this.reason = '';
    this.cancelled.emit();
  }
}
