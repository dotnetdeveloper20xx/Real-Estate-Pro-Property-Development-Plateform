import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { SearchActions } from '../../store/search.actions';
import { SearchKeyboardService } from '../../services/search-keyboard.service';

/**
 * Search trigger button component that opens the global search overlay.
 * Displays a search icon with a Ctrl+K keyboard hint (hidden on mobile).
 * Listens to the keyboard shortcut service to open the overlay via Ctrl+K / Cmd+K.
 */
@Component({
  selector: 'app-search-trigger',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="btn btn-ghost gap-2"
      aria-label="Open search"
      (click)="openSearch()"
    >
      <span class="material-symbols-outlined text-xl" aria-hidden="true">search</span>
      <kbd class="kbd kbd-sm hidden md:inline-flex text-base-content/60">Ctrl+K</kbd>
    </button>
  `
})
export class SearchTriggerComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly keyboardService = inject(SearchKeyboardService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.keyboardService.onOpenOverlay
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.dispatch(SearchActions.openOverlay());
      });
  }

  /** Dispatch the open overlay action on button click. */
  openSearch(): void {
    this.store.dispatch(SearchActions.openOverlay());
  }
}
