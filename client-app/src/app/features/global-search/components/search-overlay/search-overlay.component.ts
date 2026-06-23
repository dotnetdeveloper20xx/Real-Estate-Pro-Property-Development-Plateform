import {
  Component,
  ChangeDetectionStrategy,
  inject,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';

import { SearchActions } from '../../store/search.actions';
import {
  selectOverlayOpen,
  selectSearchResults,
  selectSearchLoading,
  selectError,
  selectTotalCount,
  selectActiveTab,
  selectRecentSearches,
  selectPinnedItems,
  selectSelectedResultIndex,
  selectPreviewItem,
  selectCommandMode,
  selectCategoryCounts
} from '../../store/search.selectors';
import { ISearchResultItem, IRecentSearch, IPinnedItem } from '../../models';

/**
 * SearchOverlayComponent is the container (smart) component for the Global Search overlay.
 * It renders as a modal dialog with focus trapping, Escape-to-close, NgRx state management,
 * and responsive layout based on viewport breakpoints.
 *
 * Responsive breakpoints:
 * - ≥1440px: Full-width overlay with preview panel
 * - 1024–1439px: Full-width overlay without preview panel
 * - 768–1023px: Full-screen overlay
 * - <768px: Full-screen simplified overlay
 */
@Component({
  selector: 'app-search-overlay',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (overlayOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-50 bg-base-300/60 backdrop-blur-sm transition-opacity"
        (click)="close()"
        aria-hidden="true"
      ></div>

      <!-- Dialog -->
      <div
        #dialogElement
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        class="fixed z-50 flex flex-col bg-base-100 shadow-2xl border border-base-300 overflow-hidden"
        [class]="overlayLayoutClass()"
        (keydown)="onKeydown($event)"
      >
        <!-- Header with search input area -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-base-300">
          <span class="material-symbols-outlined text-base-content/60" aria-hidden="true">search</span>
          <input
            #searchInput
            type="text"
            class="flex-1 bg-transparent text-base-content placeholder-base-content/50 text-lg outline-none"
            placeholder="Search across all modules..."
            aria-label="Search query"
            [value]="query()"
            (input)="onQueryChange($event)"
          />
          <kbd class="kbd kbd-sm text-base-content/40">ESC</kbd>
        </div>

        <!-- Tabs section -->
        @if (categoryCounts().length > 0) {
          <div
            class="flex items-center gap-1 px-4 py-2 border-b border-base-300 overflow-x-auto"
            role="tablist"
            aria-label="Search result categories"
          >
            <button
              role="tab"
              class="tab tab-sm"
              [class.tab-active]="activeTab() === 'all'"
              [attr.aria-selected]="activeTab() === 'all'"
              (click)="setActiveTab('all')"
            >
              All ({{ totalCount() }})
            </button>
            @for (cat of categoryCounts(); track cat.category) {
              <button
                role="tab"
                class="tab tab-sm"
                [class.tab-active]="activeTab() === cat.category"
                [attr.aria-selected]="activeTab() === cat.category"
                (click)="setActiveTab(cat.category)"
              >
                <span class="material-symbols-outlined text-sm mr-1" aria-hidden="true">{{ cat.icon }}</span>
                {{ cat.category }} ({{ cat.count }})
              </button>
            }
          </div>
        }

        <!-- Content area -->
        <div class="flex flex-1 overflow-hidden">
          <!-- Results panel -->
          <div class="flex-1 overflow-y-auto px-4 py-3" role="listbox" aria-label="Search results">
            @if (loading()) {
              <!-- Loading skeleton -->
              <div class="space-y-3" aria-busy="true" aria-label="Loading search results">
                @for (i of skeletonItems; track i) {
                  <div class="animate-pulse flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-base-300"></div>
                    <div class="flex-1 space-y-2">
                      <div class="h-4 bg-base-300 rounded w-3/4"></div>
                      <div class="h-3 bg-base-300 rounded w-1/2"></div>
                    </div>
                  </div>
                }
              </div>
            } @else if (error()) {
              <!-- Error state -->
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <span class="material-symbols-outlined text-4xl text-error mb-3" aria-hidden="true">error</span>
                <p class="text-base-content font-medium">Search could not be completed</p>
                <p class="text-base-content/60 text-sm mt-1">{{ error() }}</p>
                <button class="btn btn-sm btn-primary mt-4" (click)="retry()">
                  <span class="material-symbols-outlined text-sm" aria-hidden="true">refresh</span>
                  Retry
                </button>
              </div>
            } @else if (totalCount() === 0 && query().length > 0) {
              <!-- Empty state -->
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <span class="material-symbols-outlined text-4xl text-base-content/30 mb-3" aria-hidden="true">search_off</span>
                <p class="text-base-content font-medium">No results found</p>
                <p class="text-base-content/60 text-sm mt-1">Try refining or modifying your search terms</p>
              </div>
            } @else if (query().length === 0) {
              <!-- Initial state: recent searches and pinned items -->
              <div class="space-y-6">
                @if (recentSearches().length > 0) {
                  <section>
                    <h3 class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">Recent Searches</h3>
                    <ul class="space-y-1">
                      @for (recent of recentSearches(); track recent.id) {
                        <li>
                          <button
                            class="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-base-200 transition-colors text-left"
                            (click)="executeRecentSearch(recent)"
                          >
                            <span class="material-symbols-outlined text-base-content/40 text-sm" aria-hidden="true">history</span>
                            <span class="text-base-content text-sm">{{ recent.query }}</span>
                            <span class="ml-auto text-xs text-base-content/40">{{ recent.resultCount }} results</span>
                          </button>
                        </li>
                      }
                    </ul>
                  </section>
                }
                @if (pinnedItems().length > 0) {
                  <section>
                    <h3 class="text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-2">Pinned Items</h3>
                    <ul class="space-y-1">
                      @for (pinned of pinnedItems(); track pinned.id) {
                        <li>
                          <button
                            class="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-base-200 transition-colors text-left"
                            (click)="navigateToPinned(pinned)"
                          >
                            <span class="material-symbols-outlined text-sm" aria-hidden="true">{{ pinned.icon }}</span>
                            <span class="text-base-content text-sm">{{ pinned.title }}</span>
                            @if (pinned.subtitle) {
                              <span class="text-xs text-base-content/40">{{ pinned.subtitle }}</span>
                            }
                          </button>
                        </li>
                      }
                    </ul>
                  </section>
                }
              </div>
            } @else {
              <!-- Search results -->
              <div class="space-y-2">
                @for (result of flatResults(); track result.entityId; let idx = $index) {
                  <button
                    role="option"
                    class="flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-left"
                    [class.bg-primary/10]="selectedResultIndex() === idx"
                    [class.hover:bg-base-200]="selectedResultIndex() !== idx"
                    [attr.aria-selected]="selectedResultIndex() === idx"
                    (click)="navigateToResult(result)"
                    (mouseenter)="selectResult(idx)"
                  >
                    <span class="material-symbols-outlined text-base-content/60" aria-hidden="true">{{ result.icon }}</span>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm font-medium text-base-content truncate"
                          [innerHTML]="result.highlightedTitle || result.title"
                        ></span>
                        @if (result.status) {
                          <span class="badge badge-sm" [class]="getStatusBadgeClass(result.statusVariant)">
                            {{ result.status }}
                          </span>
                        }
                      </div>
                      @if (!isMobile()) {
                        <div class="flex items-center gap-2 mt-0.5">
                          <span class="text-xs text-base-content/50">{{ result.subtitle }}</span>
                          @if (result.breadcrumb) {
                            <span class="text-xs text-base-content/30">·</span>
                            <span class="text-xs text-base-content/40">{{ result.breadcrumb }}</span>
                          }
                        </div>
                      }
                    </div>
                    @if (!isMobile()) {
                      <span class="badge badge-ghost badge-sm">{{ result.moduleBadge }}</span>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Preview panel (desktop ≥1440px only) -->
          @if (showPreviewPanel() && previewItem()) {
            <div class="w-80 border-l border-base-300 overflow-y-auto px-4 py-3 hidden 2xl:block">
              <div class="space-y-4">
                <h3 class="font-semibold text-base-content">{{ previewItem()!.title }}</h3>
                @if (previewItem()!.status) {
                  <span class="badge badge-sm" [class]="getStatusBadgeClass(previewItem()!.statusVariant)">
                    {{ previewItem()!.status }}
                  </span>
                }
                <p class="text-sm text-base-content/60">{{ previewItem()!.subtitle }}</p>
                <div class="flex gap-2 pt-2">
                  <button class="btn btn-sm btn-primary" (click)="navigateToResult(previewItem()!)">View</button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Result count announcement for screen readers -->
        <div class="sr-only" aria-live="polite" aria-atomic="true">
          @if (totalCount() > 0) {
            {{ totalCount() }} results found
          }
        </div>
      </div>
    }
  `
})
export class SearchOverlayComponent implements AfterViewInit, OnDestroy {
  private readonly store = inject(Store);

  /** Reference to the dialog element for focus trapping */
  @ViewChild('dialogElement') dialogElement!: ElementRef<HTMLElement>;

  /** Reference to the search input for initial focus */
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  /** Element that had focus before the overlay opened */
  private triggerElement: HTMLElement | null = null;

  /** Skeleton placeholder items for loading state */
  readonly skeletonItems = [1, 2, 3, 4, 5];

  // --- NgRx selectors as signals ---
  readonly overlayOpen = this.store.selectSignal(selectOverlayOpen);
  readonly results = this.store.selectSignal(selectSearchResults);
  readonly loading = this.store.selectSignal(selectSearchLoading);
  readonly error = this.store.selectSignal(selectError);
  readonly totalCount = this.store.selectSignal(selectTotalCount);
  readonly activeTab = this.store.selectSignal(selectActiveTab);
  readonly recentSearches = this.store.selectSignal(selectRecentSearches);
  readonly pinnedItems = this.store.selectSignal(selectPinnedItems);
  readonly selectedResultIndex = this.store.selectSignal(selectSelectedResultIndex);
  readonly previewItem = this.store.selectSignal(selectPreviewItem);
  readonly commandMode = this.store.selectSignal(selectCommandMode);
  readonly categoryCounts = this.store.selectSignal(selectCategoryCounts);

  /** Reactive viewport width signal for responsive breakpoints */
  readonly viewportWidth = signal(typeof window !== 'undefined' ? window.innerWidth : 1440);

  /** Current query text (local for display; dispatched on change) */
  readonly query = signal('');

  /** Whether to show the preview panel (≥1440px) */
  readonly showPreviewPanel = computed(() => this.viewportWidth() >= 1440);

  /** Whether to display in mobile simplified mode (<768px) */
  readonly isMobile = computed(() => this.viewportWidth() < 768);

  /** Computed layout class based on viewport width */
  readonly overlayLayoutClass = computed(() => {
    const w = this.viewportWidth();
    if (w >= 1440) {
      // Desktop: centered overlay with max-width, not full-screen
      return 'inset-x-0 top-16 mx-auto w-full max-w-5xl rounded-xl max-h-[80vh]';
    } else if (w >= 1024) {
      // Laptop: full-width overlay without preview
      return 'inset-x-0 top-16 mx-auto w-full max-w-4xl rounded-xl max-h-[80vh]';
    } else if (w >= 768) {
      // Tablet: full-screen overlay
      return 'inset-0 rounded-none h-full';
    } else {
      // Mobile: full-screen simplified
      return 'inset-0 rounded-none h-full';
    }
  });

  /** Flattened results list for keyboard navigation rendering */
  readonly flatResults = computed(() => {
    return this.results().flatMap(category => category.results);
  });

  private resizeListener: (() => void) | null = null;

  constructor() {
    // Effect to focus the input when overlay opens
    effect(() => {
      if (this.overlayOpen()) {
        this.triggerElement = document.activeElement as HTMLElement;
        // Use requestAnimationFrame to wait for DOM to render
        requestAnimationFrame(() => {
          this.searchInput?.nativeElement?.focus();
        });
      }
    });
  }

  ngAfterViewInit(): void {
    // Listen for window resize to update viewport width signal
    this.resizeListener = () => {
      this.viewportWidth.set(window.innerWidth);
    };
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  /**
   * Handle all keydown events within the overlay dialog.
   * Implements focus trapping (Tab/Shift+Tab) and Escape to close.
   */
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.navigateDown();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.navigateUp();
      return;
    }

    if (event.key === 'Enter') {
      this.onEnter(event);
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  /**
   * Close the overlay and return focus to the trigger element.
   */
  close(): void {
    this.store.dispatch(SearchActions.closeOverlay());
    this.query.set('');
    // Return focus to the element that triggered the overlay
    requestAnimationFrame(() => {
      this.triggerElement?.focus();
      this.triggerElement = null;
    });
  }

  /**
   * Handle search input change.
   */
  onQueryChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);

    if (value.length >= 1) {
      this.store.dispatch(SearchActions.executeSearch({ query: value }));
    } else {
      this.store.dispatch(SearchActions.clearSearch());
    }
  }

  /**
   * Set active category tab.
   */
  setActiveTab(tab: string): void {
    this.store.dispatch(SearchActions.setActiveTab({ tab }));
  }

  /**
   * Navigate to a search result and close overlay.
   */
  navigateToResult(result: ISearchResultItem): void {
    this.store.dispatch(SearchActions.navigateToResult({ result }));
    this.close();
  }

  /**
   * Execute a recent search by populating the query.
   */
  executeRecentSearch(recent: IRecentSearch): void {
    this.query.set(recent.query);
    this.store.dispatch(SearchActions.executeSearch({ query: recent.query }));
  }

  /**
   * Navigate to a pinned item and close overlay.
   */
  navigateToPinned(pinned: IPinnedItem): void {
    this.store.dispatch(SearchActions.navigateToResult({
      result: {
        entityId: pinned.entityId,
        entityType: pinned.entityType,
        title: pinned.title,
        highlightedTitle: null,
        subtitle: pinned.subtitle || '',
        highlightedSubtitle: null,
        status: null,
        statusVariant: null,
        icon: pinned.icon,
        category: pinned.category,
        moduleBadge: pinned.category,
        navigationRoute: pinned.navigationRoute,
        lastUpdated: pinned.pinnedAt,
        breadcrumb: null,
        relevancyScore: 0,
        quickActions: []
      }
    }));
    this.close();
  }

  /**
   * Select a result by index (keyboard navigation or hover).
   */
  selectResult(index: number): void {
    this.store.dispatch(SearchActions.selectResult({ index }));
  }

  /**
   * Retry the last failed search.
   */
  retry(): void {
    const q = this.query();
    if (q.length >= 1) {
      this.store.dispatch(SearchActions.executeSearch({ query: q }));
    }
  }

  /**
   * Get DaisyUI badge class for a status variant.
   */
  getStatusBadgeClass(variant: string | null): string {
    switch (variant) {
      case 'success': return 'badge-success';
      case 'info': return 'badge-info';
      case 'warning': return 'badge-warning';
      case 'error': return 'badge-error';
      case 'ghost': return 'badge-ghost';
      default: return 'badge-ghost';
    }
  }

  // --- Private helpers ---

  /**
   * Trap focus within the dialog element.
   * Tab cycles forward, Shift+Tab cycles backward through focusable elements.
   */
  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.dialogElement?.nativeElement;
    if (!dialog) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if at first element, wrap to last
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: if at last element, wrap to first
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Navigate down through results.
   */
  private navigateDown(): void {
    const flat = this.flatResults();
    const current = this.selectedResultIndex();
    const next = current < flat.length - 1 ? current + 1 : 0;
    this.store.dispatch(SearchActions.selectResult({ index: next }));
  }

  /**
   * Navigate up through results.
   */
  private navigateUp(): void {
    const flat = this.flatResults();
    const current = this.selectedResultIndex();
    const prev = current > 0 ? current - 1 : flat.length - 1;
    this.store.dispatch(SearchActions.selectResult({ index: prev }));
  }

  /**
   * Handle Enter key: navigate to selected result.
   */
  private onEnter(event: KeyboardEvent): void {
    const flat = this.flatResults();
    const index = this.selectedResultIndex();
    if (index >= 0 && index < flat.length) {
      event.preventDefault();
      const result = flat[index];
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+Enter: open in new tab
        window.open(result.navigationRoute, '_blank');
      } else {
        this.navigateToResult(result);
      }
    }
  }
}
