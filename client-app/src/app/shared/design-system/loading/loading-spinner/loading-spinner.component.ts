import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Loading spinner component with configurable size.
 * Displays a rotating spinner to indicate async operations in progress.
 *
 * Sizes:
 * - sm: 16px diameter
 * - md: 24px diameter (default)
 * - lg: 40px diameter
 */
@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
      [class]="sizeClass()"
      role="status"
      [attr.aria-busy]="true"
      [attr.aria-label]="ariaLabel()"
    >
      <span class="sr-only">{{ ariaLabel() }}</span>
    </span>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
    }

    .spinner-md {
      width: 24px;
      height: 24px;
    }

    .spinner-lg {
      width: 40px;
      height: 40px;
    }
  `]
})
export class LoadingSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly ariaLabel = input<string>('Loading');

  readonly sizeClass = computed(() => {
    const sizeMap: Record<string, string> = {
      sm: 'spinner-sm',
      md: 'spinner-md',
      lg: 'spinner-lg'
    };
    return sizeMap[this.size()] ?? 'spinner-md';
  });
}
