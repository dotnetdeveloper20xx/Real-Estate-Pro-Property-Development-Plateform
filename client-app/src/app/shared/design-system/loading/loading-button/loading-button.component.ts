import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner.component';

/**
 * Loading button component that shows a spinner replacing the icon,
 * disables the button, and optionally shows loadingText while loading.
 *
 * Content projects the default button label/icon.
 * When loading=true, the spinner replaces the icon and loadingText replaces the label.
 */
@Component({
  selector: 'app-loading-button',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="btn"
      [disabled]="isDisabled()"
      [attr.aria-busy]="loading() ? true : null"
      [attr.aria-label]="loading() ? displayText() : null"
      type="button"
    >
      @if (loading()) {
        <app-loading-spinner size="sm" [ariaLabel]="displayText()" />
        <span>{{ displayText() }}</span>
      } @else {
        <ng-content />
      }
    </button>
  `,
  styles: [`
    :host {
      display: inline-block;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }
  `]
})
export class LoadingButtonComponent {
  readonly loading = input<boolean>(false);
  readonly loadingText = input<string>('Loading...');
  readonly disabled = input<boolean>(false);

  readonly isDisabled = computed(() => this.loading() || this.disabled());

  readonly displayText = computed(() => {
    const text = this.loadingText();
    return text.length > 30 ? text.substring(0, 30) : text;
  });
}
