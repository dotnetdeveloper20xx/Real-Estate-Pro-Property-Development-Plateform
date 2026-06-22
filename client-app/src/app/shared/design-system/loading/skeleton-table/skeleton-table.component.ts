import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Skeleton table component that renders placeholder table rows
 * with shimmer animation to indicate data is loading.
 *
 * Use `rows` and `columns` inputs to control the placeholder dimensions.
 */
@Component({
  selector: 'app-skeleton-table',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div
        class="w-full overflow-x-auto"
        [attr.aria-busy]="true"
        [attr.aria-label]="'Loading table data'"
        role="status"
      >
        <table class="table w-full">
          <thead>
            <tr>
              @for (col of columnArray(); track $index) {
                <th>
                  <div class="skeleton-shimmer h-4 w-20 rounded"></div>
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rowArray(); track $index) {
              <tr>
                @for (col of columnArray(); track $index) {
                  <td>
                    <div class="skeleton-shimmer h-4 rounded" [style.width]="cellWidth($index)"></div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
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
export class SkeletonTableComponent {
  readonly loading = input<boolean>(false);
  readonly rows = input<number>(5);
  readonly columns = input<number>(4);

  readonly rowArray = computed(() => Array.from({ length: this.rows() }));
  readonly columnArray = computed(() => Array.from({ length: this.columns() }));

  cellWidth(colIndex: number): string {
    // Vary widths for a more natural look
    const widths = ['60%', '80%', '45%', '70%', '55%', '90%', '50%', '75%'];
    return widths[colIndex % widths.length];
  }
}
