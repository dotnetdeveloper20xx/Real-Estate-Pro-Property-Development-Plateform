import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton card component that renders placeholder card shapes
 * with shimmer animation to indicate loading state.
 *
 * Use `count` to render multiple skeleton cards.
 */
@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div
        class="grid gap-4"
        [class]="gridClass()"
        [attr.aria-busy]="true"
        [attr.aria-label]="'Loading ' + count() + ' cards'"
        role="status"
      >
        @for (item of cards(); track $index) {
          <div class="card bg-base-200 shadow-sm">
            <div class="card-body gap-3">
              <!-- Image placeholder -->
              <div class="skeleton-shimmer h-32 w-full rounded-lg"></div>
              <!-- Title placeholder -->
              <div class="skeleton-shimmer h-5 w-3/4 rounded"></div>
              <!-- Text placeholder lines -->
              <div class="skeleton-shimmer h-4 w-full rounded"></div>
              <div class="skeleton-shimmer h-4 w-5/6 rounded"></div>
            </div>
          </div>
        }
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
export class SkeletonCardComponent {
  readonly loading = input<boolean>(false);
  readonly count = input<number>(3);

  readonly cards = computed(() => Array.from({ length: this.count() }));

  readonly gridClass = computed(() => {
    const c = this.count();
    if (c === 1) return 'grid-cols-1';
    if (c === 2) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  });
}
