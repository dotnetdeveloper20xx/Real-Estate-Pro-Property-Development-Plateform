import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Empty State Component (`app-empty-state`)
 *
 * Displays an informative placeholder when no data is available in a container.
 * Provides title, optional subtitle, optional icon, and optional primary/secondary
 * action buttons to guide users toward the next step.
 *
 * Layout is centred both vertically and horizontally within its parent container.
 * Missing optional elements (subtitle, actions) do not reserve space.
 *
 * @requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center text-center p-8 w-full h-full">
      <!-- Icon -->
      <span
        *ngIf="icon"
        class="material-symbols-outlined text-base-content/40 mb-4"
        style="font-size: 48px;"
        aria-hidden="true"
      >
        {{ icon }}
      </span>

      <!-- Title (required) -->
      <h3 class="text-lg font-semibold text-base-content">
        {{ title | slice:0:100 }}
      </h3>

      <!-- Subtitle (optional) -->
      <p
        *ngIf="subtitle"
        class="text-sm text-base-content/60 mt-2 max-w-md"
      >
        {{ subtitle | slice:0:200 }}
      </p>

      <!-- Action Buttons -->
      <div
        *ngIf="primaryActionText || secondaryActionText"
        class="flex flex-col items-center gap-2 mt-6"
      >
        <!-- Primary Action -->
        <button
          *ngIf="primaryActionText"
          type="button"
          class="btn btn-primary"
          (click)="primaryAction.emit()"
        >
          {{ primaryActionText }}
        </button>

        <!-- Secondary Action -->
        <button
          *ngIf="secondaryActionText"
          type="button"
          class="btn btn-ghost"
          (click)="secondaryAction.emit()"
        >
          {{ secondaryActionText }}
        </button>
      </div>
    </div>
  `,
})
export class EmptyStateComponent {
  // ─── Inputs ──────────────────────────────────────────────────────────────────

  /** Title text displayed prominently (required, max 100 characters) */
  @Input({ required: true }) title!: string;

  /** Optional subtitle providing additional context (max 200 characters) */
  @Input() subtitle?: string;

  /** Optional Material Symbols icon name (rendered at 48px, 40% opacity) */
  @Input() icon?: string;

  /** Optional text for the primary action button */
  @Input() primaryActionText?: string;

  /** Optional text for the secondary action button */
  @Input() secondaryActionText?: string;

  // ─── Outputs ─────────────────────────────────────────────────────────────────

  /** Emitted when the primary action button is clicked */
  @Output() primaryAction = new EventEmitter<void>();

  /** Emitted when the secondary action button is clicked */
  @Output() secondaryAction = new EventEmitter<void>();
}
