import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

/**
 * Loading overlay component that displays a semi-transparent backdrop
 * with a spinner, intercepting all pointer and keyboard events on the
 * covered area while in loading state.
 */
@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <ng-content />

      @if (loading()) {
        <div
          class="absolute inset-0 z-50 flex items-center justify-center bg-base-100/60 backdrop-blur-[1px]"
          [attr.aria-busy]="true"
          [attr.aria-label]="ariaLabel()"
          role="status"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <app-loading-spinner size="lg" [ariaLabel]="ariaLabel()" />
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LoadingOverlayComponent {
  readonly loading = input<boolean>(false);
  readonly ariaLabel = input<string>('Loading');
}
