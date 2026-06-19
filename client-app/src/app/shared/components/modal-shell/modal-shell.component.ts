import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Enterprise reusable modal shell component.
 * Provides the DaisyUI `<dialog>` pattern with configurable header, body (projected content),
 * footer (projected via `[modal-footer]`), loading overlay, and size options.
 *
 * All feature modals should use this as their foundation.
 *
 * Usage:
 * ```html
 * <app-modal-shell
 *   [visible]="showModal"
 *   title="Create Opportunity"
 *   subtitle="Add a new land opportunity to the pipeline"
 *   icon="add_circle"
 *   iconClass="text-primary"
 *   size="md"
 *   [loading]="isSubmitting"
 *   (closed)="onModalClosed()">
 *
 *   <!-- Body content projected here -->
 *   <p>Your form or content goes here.</p>
 *
 *   <!-- Footer content projected via attribute selector -->
 *   <div modal-footer>
 *     <button class="btn btn-ghost" (click)="onModalClosed()">Cancel</button>
 *     <button class="btn btn-primary" (click)="onSave()">Save</button>
 *   </div>
 * </app-modal-shell>
 * ```
 */
@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      class="modal"
      [class.modal-open]="visible"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="title ? 'modal-shell-title' : null">
      <div class="modal-box" [ngClass]="sizeClass">

        <!-- Header -->
        <div class="flex items-center gap-3 pb-4 border-b border-base-200">
          <div
            *ngIf="icon"
            class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-xl" [ngClass]="iconClass">{{ icon }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 id="modal-shell-title" class="text-lg font-bold text-base-content truncate">{{ title }}</h3>
            <p *ngIf="subtitle" class="text-xs text-base-content/60 mt-0.5 truncate">{{ subtitle }}</p>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-sm btn-square shrink-0"
            (click)="onClose()"
            aria-label="Close modal">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- Body (projected content) -->
        <div class="py-5 relative">
          <ng-content></ng-content>

          <!-- Loading overlay -->
          <div
            *ngIf="loading"
            class="absolute inset-0 bg-base-100/80 flex items-center justify-center rounded-lg z-10"
            role="status"
            aria-label="Loading">
            <span class="loading loading-spinner loading-md text-primary"></span>
          </div>
        </div>

        <!-- Footer (projected) -->
        <div *ngIf="showFooter" class="pt-4 border-t border-base-200">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>

      <!-- Backdrop -->
      <form method="dialog" class="modal-backdrop">
        <button type="button" (click)="onClose()" aria-label="Close modal">close</button>
      </form>
    </dialog>
  `
})
export class ModalShellComponent {
  /** Controls modal visibility */
  @Input() visible = false;

  /** Modal title displayed in the header */
  @Input() title = '';

  /** Optional subtitle displayed beneath the title */
  @Input() subtitle = '';

  /** Material Symbols icon name displayed in the header */
  @Input() icon = '';

  /** CSS class applied to the icon (e.g., text-primary, text-error) */
  @Input() iconClass = 'text-primary';

  /** Modal width: sm (max-w-sm), md (max-w-md), lg (max-w-lg), xl (max-w-2xl) */
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  /** Shows a loading overlay on the body content */
  @Input() loading = false;

  /** Whether to render the footer slot */
  @Input() showFooter = true;

  /** Emitted when the user closes the modal (close button or backdrop click) */
  @Output() closed = new EventEmitter<void>();

  /** Returns the Tailwind max-width class based on the size input */
  get sizeClass(): string {
    switch (this.size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-2xl';
      default:   return 'max-w-md';
    }
  }

  /** Handle close interactions */
  onClose(): void {
    this.closed.emit();
  }
}
