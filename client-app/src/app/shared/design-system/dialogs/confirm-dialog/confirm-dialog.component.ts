import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';

/** Severity level for the confirm dialog */
export type ConfirmDialogSeverity = 'info' | 'warning' | 'danger';

/** Resolution actions for the dialog */
export type ConfirmDialogResolution = 'confirm' | 'cancel' | 'backdrop' | 'escape';

/** Mapping severity to DaisyUI confirm button class */
const SEVERITY_BUTTON_CLASS: Record<ConfirmDialogSeverity, string> = {
  info: 'btn-info',
  warning: 'btn-warning',
  danger: 'btn-error',
};

/** Mapping severity to icon colour class */
const SEVERITY_ICON_CLASS: Record<ConfirmDialogSeverity, string> = {
  info: 'text-info',
  warning: 'text-warning',
  danger: 'text-error',
};

/** Mapping severity to icon name */
const SEVERITY_ICON: Record<ConfirmDialogSeverity, string> = {
  info: 'info',
  warning: 'warning',
  danger: 'error',
};

let nextDialogId = 0;

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('dialogAnimation', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void => visible', [animate('200ms ease-out')]),
      transition('visible => void', [animate('150ms ease-in')]),
    ]),
    trigger('backdropAnimation', [
      state('void', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('void => visible', [animate('200ms ease-out')]),
      transition('visible => void', [animate('150ms ease-in')]),
    ]),
  ],
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center"
      role="presentation"
      (keydown)="onKeydown($event)"
    >
      <!-- Backdrop overlay -->
      <div
        class="absolute inset-0 bg-black/50"
        [@backdropAnimation]="'visible'"
        (click)="onBackdropClick()"
        data-testid="confirm-dialog-backdrop"
      ></div>

      <!-- Dialog -->
      <div
        class="relative z-10 bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4 p-6"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
        [attr.aria-describedby]="messageId"
        [@dialogAnimation]="'visible'"
        cdkTrapFocus
        [cdkTrapFocusAutoCapture]="true"
        data-testid="confirm-dialog"
      >
        <!-- Icon + Title -->
        <div class="flex items-start gap-3 mb-4">
          <span
            class="material-symbols-outlined text-2xl mt-0.5"
            [ngClass]="iconClass"
            aria-hidden="true"
          >{{ iconName }}</span>
          <h2
            [id]="titleId"
            class="text-lg font-semibold text-base-content"
          >{{ truncatedTitle }}</h2>
        </div>

        <!-- Message -->
        <p
          [id]="messageId"
          class="text-sm text-base-content/80 mb-6 ml-9"
        >{{ truncatedMessage }}</p>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="btn btn-ghost"
            (click)="onCancel()"
            data-testid="confirm-dialog-cancel"
          >{{ cancelText }}</button>
          <button
            type="button"
            class="btn"
            [ngClass]="confirmButtonClass"
            (click)="onConfirm()"
            data-testid="confirm-dialog-confirm"
          >{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  /** Dialog title (max 100 characters) */
  @Input() title = 'Confirm';

  /** Dialog message (max 500 characters) */
  @Input() message = '';

  /** Text for the confirm button */
  @Input() confirmText = 'Confirm';

  /** Text for the cancel button */
  @Input() cancelText = 'Cancel';

  /** Severity level: info, warning, danger */
  @Input() severity: ConfirmDialogSeverity = 'info';

  /** Emits the user's resolution */
  @Output() resolved = new EventEmitter<ConfirmDialogResolution>();

  /** Unique IDs for ARIA references */
  readonly titleId = `confirm-dialog-title-${nextDialogId}`;
  readonly messageId = `confirm-dialog-message-${nextDialogId}`;

  /** Resolved CSS class for the confirm button */
  confirmButtonClass = SEVERITY_BUTTON_CLASS['info'];

  /** Icon CSS class based on severity */
  iconClass = SEVERITY_ICON_CLASS['info'];

  /** Icon name based on severity */
  iconName = SEVERITY_ICON['info'];

  /** Previously focused element to restore on close */
  private previouslyFocusedElement: HTMLElement | null = null;

  get truncatedTitle(): string {
    if (!this.title) return '';
    return this.title.length > 100
      ? this.title.slice(0, 100) + '…'
      : this.title;
  }

  get truncatedMessage(): string {
    if (!this.message) return '';
    return this.message.length > 500
      ? this.message.slice(0, 500) + '…'
      : this.message;
  }

  ngOnInit(): void {
    nextDialogId++;
    this.confirmButtonClass = SEVERITY_BUTTON_CLASS[this.severity] || SEVERITY_BUTTON_CLASS['info'];
    this.iconClass = SEVERITY_ICON_CLASS[this.severity] || SEVERITY_ICON_CLASS['info'];
    this.iconName = SEVERITY_ICON[this.severity] || SEVERITY_ICON['info'];

    // Store the currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }

  /** Handle keyboard events */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.resolved.emit('escape');
    }
  }

  /** Handle backdrop click */
  onBackdropClick(): void {
    this.resolved.emit('backdrop');
  }

  /** Handle cancel button click */
  onCancel(): void {
    this.resolved.emit('cancel');
  }

  /** Handle confirm button click */
  onConfirm(): void {
    this.resolved.emit('confirm');
  }
}
