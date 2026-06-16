import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Deactivation Confirmation Dialog Component
 *
 * Shows a confirmation dialog with the user's name and a warning message:
 * "The user will be immediately signed out and this action can be undone"
 *
 * Requirements: 6.1
 */
@Component({
  selector: 'app-deactivate-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <dialog class="modal" [class.modal-open]="open">
      <div class="modal-box w-full max-w-md">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
            <span class="material-symbols-outlined text-warning">warning</span>
          </div>
          <h3 class="text-lg font-bold">Deactivate User</h3>
        </div>

        <div class="space-y-3">
          <p class="text-sm text-base-content/70">
            Are you sure you want to deactivate
            <span class="font-semibold text-base-content">{{ userName }}</span>?
          </p>

          <div class="alert alert-warning text-sm">
            <span class="material-symbols-outlined text-sm">info</span>
            <span>The user will be immediately signed out and this action can be undone.</span>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" (click)="onCancel()" [disabled]="processing">
            Cancel
          </button>
          <button class="btn btn-warning" (click)="onConfirm()" [disabled]="processing">
            <span *ngIf="processing" class="loading loading-spinner loading-sm"></span>
            Deactivate User
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button (click)="onCancel()">close</button>
      </form>
    </dialog>
  `
})
export class DeactivateDialogComponent {
  @Input() open = false;
  @Input() userName = '';
  @Input() processing = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
