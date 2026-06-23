/**
 * Command palette configuration and related interfaces.
 * These models define the structure for navigation commands, frequent pages,
 * and recent items displayed in the command palette mode.
 */

/**
 * Configuration for the command palette behaviour and limits.
 */
export interface ICommandPaletteConfig {
  readonly maxRecentItems: number;
  readonly maxFrequentPages: number;
  readonly maxCommands: number;
  readonly commandPrefix: string;
  readonly debounceMs: number;
  readonly minQueryLength: number;
}

/**
 * A command available in the command palette.
 */
export interface ISearchCommand {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly type: 'navigation' | 'action';
  readonly route?: string;
  readonly action?: string;
  readonly keywords: string[];
  readonly permission?: string;
  readonly category: string;
}

/**
 * A frequently accessed page tracked for command palette display.
 */
export interface IFrequentPage {
  readonly route: string;
  readonly label: string;
  readonly icon: string;
  readonly accessCount: number;
  readonly lastAccessed: string;
}

/**
 * A recently opened entity or page for command palette display.
 */
export interface IRecentItem {
  readonly entityId: string;
  readonly entityType: string;
  readonly title: string;
  readonly icon: string;
  readonly route: string;
  readonly openedAt: string;
}

/**
 * Default command palette configuration values.
 */
export const DEFAULT_COMMAND_PALETTE_CONFIG: ICommandPaletteConfig = {
  maxRecentItems: 5,
  maxFrequentPages: 5,
  maxCommands: 15,
  commandPrefix: '>',
  debounceMs: 300,
  minQueryLength: 1
};
