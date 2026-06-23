import {
  Component,
  ChangeDetectionStrategy,
  input,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { IPinnedItem } from '../../models/search.model';

/**
 * PinnedItemsComponent displays a list of user-pinned items for quick access.
 * Each item shows an icon, title, category, and navigation route.
 * Supports selecting an item and unpinning an item.
 *
 * Presentational component — receives data via input, emits events via output.
 */
@Component({
  selector: 'app-pinned-items',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pinnedItems().length > 0) {
      <div class="bg-base-100 rounded-lg">
        <div class="px-3 py-2 border-b border-base-300">
          <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
            Pinned Items
          </span>
        </div>
        <ul class="py-1" role="list" aria-label="Pinned items">
          @for (item of pinnedItems(); track item.id) {
            <li class="group">
              <div
                class="flex items-center gap-3 w-full px-4 py-2 rounded-lg hover:bg-base-200 transition-colors"
              >
                <button
                  class="flex items-center gap-3 flex-1 min-w-0 text-left"
                  [attr.aria-label]="'Navigate to ' + item.title"
                  (click)="onItemSelected(item)"
                >
                  <span
                    class="material-symbols-outlined text-sm text-primary"
                    aria-hidden="true"
                  >
                    {{ item.icon }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <span class="text-sm text-base-content truncate block">{{ item.title }}</span>
                    @if (item.subtitle) {
                      <span class="text-xs text-base-content/50 truncate block">{{ item.subtitle }}</span>
                    }
                  </div>
                  <span class="badge badge-ghost badge-xs shrink-0">{{ item.category }}</span>
                </button>
                <button
                  class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  aria-label="Unpin item"
                  title="Unpin"
                  (click)="onUnpin(item.id, $event)"
                >
                  <span class="material-symbols-outlined text-sm text-base-content/50" aria-hidden="true">
                    push_pin
                  </span>
                </button>
              </div>
            </li>
          }
        </ul>
      </div>
    } @else {
      <div class="px-4 py-6 text-center bg-base-100 rounded-lg">
        <span class="material-symbols-outlined text-2xl text-base-content/30 mb-2" aria-hidden="true">
          push_pin
        </span>
        <p class="text-sm text-base-content/60">No pinned items</p>
        <p class="text-xs text-base-content/40 mt-1">Pin items from search results for quick access</p>
      </div>
    }
  `
})
export class PinnedItemsComponent {
  /** List of pinned items to display */
  readonly pinnedItems = input<IPinnedItem[]>([]);

  /** Emits the selected pinned item for navigation */
  readonly itemSelected = output<IPinnedItem>();

  /** Emits the id of the item to unpin */
  readonly unpinItem = output<string>();

  /**
   * Emit the selected item for navigation.
   */
  onItemSelected(item: IPinnedItem): void {
    this.itemSelected.emit(item);
  }

  /**
   * Emit the item id for unpinning. Stops event propagation to prevent navigation.
   */
  onUnpin(id: string, event: Event): void {
    event.stopPropagation();
    this.unpinItem.emit(id);
  }
}
