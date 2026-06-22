import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton form component that renders placeholder form fields
 * with shimmer animation to indicate form data is loading.
 *
 * Use the `fields` input to control how many placeholder fields render.
 */
@Component({
  selector: 'app-skeleton-form',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div
        class="flex flex-col gap-5"
        [attr.aria-busy]="true"
        [attr.aria-label]="'Loading form'"
        role="status"
      >
        @for (field of fieldArray(); track $index) {
          <div class="flex flex-col gap-2">
            <!-- Label placeholder -->
            <div class="skeleton-shimmer h-4 w-24 rounded"></div>
            <!-- Input placeholder -->
            <div class="skeleton-shimmer h-10 w-full rounded-lg"></div>
          </div>
        }
        <!-- Submit button placeholder -->
        <div class="skeleton-shimmer h-10 w-32 rounded-lg mt-2"></div>
      </div>
    } @else {
      <ng-content />
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .skeleton-shimmer {
      background: linear-gradient(
        90deg,
        oklch(var(--b3)) 25%,
        oklch(var(--b2)) 50%,
        oklch(var(--b3)) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonFormComponent {
  readonly loading = input<boolean>(false);
  readonly fields = input<number>(4);

  readonly fieldArray = computed(() => Array.from({ length: this.fields() }));
}
