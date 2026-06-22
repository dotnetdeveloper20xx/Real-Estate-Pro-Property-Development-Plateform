import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import {
  trigger,
  transition,
  style,
  animate,
  state,
} from '@angular/animations';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

/** Modal size options */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

/** Mapping of modal size to Tailwind CSS class */
const SIZE_CLASS_MAP: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  fullscreen: 'w-full h-full',
};

let nextModalId = 0;

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, A11yModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('modalAnimation', [
      state('void', style({ opacity: 0, transform: 'scale(0.95)' })),
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      transition('void => visible', [animate('200ms ease-out')]),
      transition('visible => void', [animate('200ms ease-in')]),
    ]),
    trigger('backdropAnimation', [
      state('void', style({ opacity: 0 })),
      state('visible', style({ opacity: 1 })),
      transition('void => visible', [animate('200ms ease-out')]),
      transition('visible => void', [animate('200ms ease-in')]),
    ]),
  ],
  template: `
    @if (visible) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-50 flex items-center justify-center"
        role="presentation"
        (keydown.escape)="onEscapeKey()"
      >
        <!-- Backdrop overlay -->
        <div
          class="absolute inset-0 bg-black/50 transition-opacity"
          [@backdropAnimation]="'visible'"
          (click)="onBackdropClick()"
          data-testid="modal-backdrop"
        ></div>

        <!-- Modal dialog -->
        <div
          class="relative z-10 flex flex-col bg-base-100 rounded-lg shadow-xl w-full mx-4"
          [ngClass]="sizeClass"
          [class.h-full]="size === 'fullscreen'"
          [class.rounded-none]="size === 'fullscreen'"
          [class.mx-0]="size === 'fullscreen'"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [@modalAnimation]="'visible'"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
          #modalContainer
        >
          <!-- Header -->
          <div class="flex items-center gap-3 px-6 py-4 border-b border-base-300">
            @if (icon) {
              <span
                class="material-symbols-outlined text-2xl"
                [ngClass]="iconClass"
                aria-hidden="true"
              >{{ icon }}</span>
            }
            <div class="flex-1 min-w-0">
              <h2
                [id]="titleId"
                class="text-lg font-semibold text-base-content truncate"
                [title]="title"
              >{{ truncatedTitle }}</h2>
              @if (subtitle) {
                <p
                  class="text-sm text-base-content/70 truncate"
                  [title]="subtitle"
                >{{ truncatedSubtitle }}</p>
              }
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              aria-label="Close modal"
              (click)="onCloseClick()"
            >
              <span class="material-symbols-outlined text-xl" aria-hidden="true">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-4 relative">
            <ng-content></ng-content>

            <!-- Loading overlay -->
            @if (loading) {
              <div
                class="absolute inset-0 bg-base-100/70 flex items-center justify-center z-10"
                aria-busy="true"
                aria-label="Loading"
              >
                <span class="loading loading-spinner loading-lg text-primary"></span>
              </div>
            }
          </div>

          <!-- Error summary -->
          @if (errors && errors.length > 0) {
            <div
              class="px-6 py-3 border-t border-error/20 bg-error/5"
              role="alert"
              aria-live="polite"
            >
              <ul class="list-disc list-inside space-y-1">
                @for (error of errors; track error) {
                  <li class="text-sm text-error">{{ error }}</li>
                }
              </ul>
            </div>
          }

          <!-- Footer -->
          <div class="px-6 py-4 border-t border-base-300">
            <ng-content select="[modal-footer]"></ng-content>
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalComponent implements OnChanges, AfterViewInit, OnDestroy {
  /** Whether the modal is visible */
  @Input() visible = false;

  /** Modal title (max 100 chars, truncated with ellipsis) */
  @Input() title = '';

  /** Modal subtitle (max 200 chars, truncated with ellipsis) */
  @Input() subtitle = '';

  /** Material Symbols icon name */
  @Input() icon = '';

  /** CSS class for icon colour */
  @Input() iconClass = '';

  /** Modal size: sm, md, lg, xl, fullscreen. Default: md */
  @Input() size: ModalSize = 'md';

  /** Shows a loading overlay on the body content */
  @Input() loading = false;

  /** Error messages displayed above the footer */
  @Input() errors: string[] = [];

  /** Prevents backdrop click from closing the modal */
  @Input() disableBackdropClose = false;

  /** FormGroup for dirty detection — if dirty, shows confirmation before close */
  @Input() formGroup: FormGroup | null = null;

  /** Emits when the modal is closed */
  @Output() closed = new EventEmitter<void>();

  @ViewChild('modalContainer') modalContainer!: ElementRef<HTMLElement>;

  /** Unique ID for the title element (aria-labelledby) */
  readonly titleId = `modal-title-${nextModalId++}`;

  /** Resolved CSS class for the current size */
  sizeClass = SIZE_CLASS_MAP['md'];

  /** Element that had focus before the modal opened */
  private previouslyFocusedElement: HTMLElement | null = null;

  constructor(private readonly injector: Injector) {}

  get truncatedTitle(): string {
    if (!this.title) return '';
    return this.title.length > 100
      ? this.title.slice(0, 100) + '…'
      : this.title;
  }

  get truncatedSubtitle(): string {
    if (!this.subtitle) return '';
    return this.subtitle.length > 200
      ? this.subtitle.slice(0, 200) + '…'
      : this.subtitle;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['size']) {
      this.sizeClass = SIZE_CLASS_MAP[this.size] || SIZE_CLASS_MAP['md'];
    }

    if (changes['visible']) {
      if (this.visible) {
        this.onOpen();
      } else {
        this.onClose();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.visible) {
      this.onOpen();
    }
  }

  ngOnDestroy(): void {
    this.restoreFocus();
  }

  /** Handle Escape key press */
  onEscapeKey(): void {
    this.attemptClose();
  }

  /** Handle backdrop click */
  onBackdropClick(): void {
    if (this.disableBackdropClose) {
      return;
    }
    this.attemptClose();
  }

  /** Handle close button click */
  onCloseClick(): void {
    this.attemptClose();
  }

  /**
   * Attempts to close the modal.
   * If a FormGroup is passed and it's dirty, shows a confirmation dialog via ConfirmDialogService.
   */
  private attemptClose(): void {
    if (this.formGroup && this.formGroup.dirty) {
      const confirmService = this.injector.get(ConfirmDialogService);
      confirmService.confirm({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to close?',
        confirmText: 'Discard',
        cancelText: 'Keep Editing',
        severity: 'warning',
      }).subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.closed.emit();
        }
      });
      return;
    }
    this.closed.emit();
  }

  /** Called when the modal opens */
  private onOpen(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    document.body.style.overflow = 'hidden';
  }

  /** Called when the modal closes */
  private onClose(): void {
    document.body.style.overflow = '';
    this.restoreFocus();
  }

  /** Restore focus to the element that triggered the modal */
  private restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
      this.previouslyFocusedElement = null;
    }
  }
}
