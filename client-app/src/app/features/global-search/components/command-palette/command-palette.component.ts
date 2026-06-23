import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ISearchCommand,
  IFrequentPage,
  IRecentItem,
  DEFAULT_COMMAND_PALETTE_CONFIG
} from '../../models/search-config.model';

/**
 * CommandPaletteComponent displays recently opened items and frequently used pages
 * when no query is entered, and switches to command mode (showing navigation/action commands)
 * when the query starts with ">".
 *
 * Supports full keyboard navigation: Arrow Down/Up, Enter to execute, Escape to close.
 * Filters commands by user role permissions via a permissions input.
 */
@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #paletteContainer
      class="flex flex-col bg-base-100 rounded-lg"
      role="listbox"
      aria-label="Command palette"
      (keydown)="onKeydown($event)"
    >
      @if (isCommandMode()) {
        <!-- Command mode: filtered commands -->
        <div class="px-3 py-2 border-b border-base-300">
          <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
            Commands
          </span>
        </div>
        @if (filteredCommands().length === 0) {
          <div class="px-4 py-6 text-center">
            <span class="material-symbols-outlined text-2xl text-base-content/30 mb-2" aria-hidden="true">
              terminal
            </span>
            <p class="text-sm text-base-content/60">No commands match your query</p>
          </div>
        } @else {
          <ul class="py-1 max-h-80 overflow-y-auto">
            @for (cmd of filteredCommands(); track cmd.id; let idx = $index) {
              <li>
                <button
                  role="option"
                  class="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                  [class.bg-primary/10]="activeIndex() === idx"
                  [class.hover:bg-base-200]="activeIndex() !== idx"
                  [attr.aria-selected]="activeIndex() === idx"
                  (click)="executeCommand(cmd)"
                  (mouseenter)="activeIndex.set(idx)"
                >
                  <span class="material-symbols-outlined text-sm text-primary" aria-hidden="true">
                    {{ cmd.icon }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <span class="text-sm text-base-content truncate">{{ cmd.label }}</span>
                  </div>
                  <span class="badge badge-ghost badge-xs">{{ cmd.category }}</span>
                </button>
              </li>
            }
          </ul>
        }
      } @else {
        <!-- Default mode: recent items + frequent pages -->
        @if (recentItems().length > 0) {
          <div class="px-3 py-2 border-b border-base-300">
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
              Recently Opened
            </span>
          </div>
          <ul class="py-1">
            @for (item of recentItems(); track item.entityId; let idx = $index) {
              <li>
                <button
                  role="option"
                  class="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                  [class.bg-primary/10]="activeIndex() === idx"
                  [class.hover:bg-base-200]="activeIndex() !== idx"
                  [attr.aria-selected]="activeIndex() === idx"
                  (click)="selectRecentItem(item)"
                  (mouseenter)="activeIndex.set(idx)"
                >
                  <span class="material-symbols-outlined text-sm text-base-content/60" aria-hidden="true">
                    {{ item.icon }}
                  </span>
                  <span class="text-sm text-base-content truncate">{{ item.title }}</span>
                </button>
              </li>
            }
          </ul>
        }

        @if (frequentPages().length > 0) {
          <div class="px-3 py-2 border-b border-base-300" [class.border-t]="recentItems().length > 0">
            <span class="text-xs font-semibold text-base-content/50 uppercase tracking-wider">
              Frequently Used
            </span>
          </div>
          <ul class="py-1">
            @for (page of frequentPages(); track page.route; let idx = $index) {
              <li>
                <button
                  role="option"
                  class="flex items-center gap-3 w-full px-4 py-2 text-left transition-colors"
                  [class.bg-primary/10]="activeIndex() === recentItems().length + idx"
                  [class.hover:bg-base-200]="activeIndex() !== recentItems().length + idx"
                  [attr.aria-selected]="activeIndex() === recentItems().length + idx"
                  (click)="selectFrequentPage(page)"
                  (mouseenter)="activeIndex.set(recentItems().length + idx)"
                >
                  <span class="material-symbols-outlined text-sm text-base-content/60" aria-hidden="true">
                    {{ page.icon }}
                  </span>
                  <span class="text-sm text-base-content truncate">{{ page.label }}</span>
                  <span class="ml-auto text-xs text-base-content/40">{{ page.accessCount }} visits</span>
                </button>
              </li>
            }
          </ul>
        }

        @if (recentItems().length === 0 && frequentPages().length === 0) {
          <div class="px-4 py-6 text-center">
            <span class="material-symbols-outlined text-2xl text-base-content/30 mb-2" aria-hidden="true">
              explore
            </span>
            <p class="text-sm text-base-content/60">Start typing to search or use ">" for commands</p>
          </div>
        }
      }
    </div>
  `
})
export class CommandPaletteComponent {
  /** Whether command mode is active (query starts with ">") */
  readonly commandMode = input<boolean>(false);

  /** Current query string from the search input */
  readonly query = input<string>('');

  /** Available commands to display in command mode */
  readonly commands = input<ISearchCommand[]>([]);

  /** Recently opened items for default display */
  readonly recentlyOpened = input<IRecentItem[]>([]);

  /** Frequently used pages for default display */
  readonly frequentlyUsed = input<IFrequentPage[]>([]);

  /** User permissions for filtering commands */
  readonly userPermissions = input<string[]>([]);

  /** Emits when a command is executed */
  readonly commandExecuted = output<ISearchCommand>();

  /** Emits when a recent item is selected */
  readonly recentItemSelected = output<IRecentItem>();

  /** Emits when a frequent page is selected */
  readonly frequentPageSelected = output<IFrequentPage>();

  /** Emits when Escape is pressed to close the palette */
  readonly closed = output<void>();

  /** Currently active/highlighted index for keyboard navigation */
  readonly activeIndex = signal<number>(0);

  /** Whether we are in command mode (query starts with ">") */
  readonly isCommandMode = computed(() => this.commandMode() || this.query().startsWith('>'));

  /** Recent items limited to max 5 */
  readonly recentItems = computed(() =>
    this.recentlyOpened().slice(0, DEFAULT_COMMAND_PALETTE_CONFIG.maxRecentItems)
  );

  /** Frequent pages limited to max 5 */
  readonly frequentPages = computed(() =>
    this.frequentlyUsed().slice(0, DEFAULT_COMMAND_PALETTE_CONFIG.maxFrequentPages)
  );

  /** Commands filtered by user permissions and query text */
  readonly filteredCommands = computed(() => {
    const permissions = this.userPermissions();
    const queryText = this.query().replace(/^>\s*/, '').toLowerCase().trim();

    let cmds = this.commands().filter(cmd => {
      if (!cmd.permission) return true;
      return permissions.includes(cmd.permission);
    });

    if (queryText.length > 0) {
      cmds = cmds.filter(cmd =>
        cmd.label.toLowerCase().includes(queryText) ||
        cmd.keywords.some(kw => kw.toLowerCase().includes(queryText))
      );
    }

    return cmds.slice(0, DEFAULT_COMMAND_PALETTE_CONFIG.maxCommands);
  });

  /** Total navigable items count for keyboard bounds */
  private readonly totalItems = computed(() => {
    if (this.isCommandMode()) {
      return this.filteredCommands().length;
    }
    return this.recentItems().length + this.frequentPages().length;
  });

  /**
   * Handle keyboard navigation within the palette.
   */
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.navigateDown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.navigateUp();
        break;
      case 'Enter':
        event.preventDefault();
        this.executeActive();
        break;
      case 'Escape':
        event.preventDefault();
        this.closed.emit();
        break;
    }
  }

  /**
   * Execute a specific command.
   */
  executeCommand(cmd: ISearchCommand): void {
    this.commandExecuted.emit(cmd);
  }

  /**
   * Select a recently opened item.
   */
  selectRecentItem(item: IRecentItem): void {
    this.recentItemSelected.emit(item);
  }

  /**
   * Select a frequently used page.
   */
  selectFrequentPage(page: IFrequentPage): void {
    this.frequentPageSelected.emit(page);
  }

  private navigateDown(): void {
    const total = this.totalItems();
    if (total === 0) return;
    const current = this.activeIndex();
    this.activeIndex.set(current < total - 1 ? current + 1 : 0);
  }

  private navigateUp(): void {
    const total = this.totalItems();
    if (total === 0) return;
    const current = this.activeIndex();
    this.activeIndex.set(current > 0 ? current - 1 : total - 1);
  }

  private executeActive(): void {
    const idx = this.activeIndex();
    if (this.isCommandMode()) {
      const cmds = this.filteredCommands();
      if (idx >= 0 && idx < cmds.length) {
        this.commandExecuted.emit(cmds[idx]);
      }
    } else {
      const recents = this.recentItems();
      if (idx < recents.length) {
        this.recentItemSelected.emit(recents[idx]);
      } else {
        const pageIdx = idx - recents.length;
        const pages = this.frequentPages();
        if (pageIdx >= 0 && pageIdx < pages.length) {
          this.frequentPageSelected.emit(pages[pageIdx]);
        }
      }
    }
  }
}
