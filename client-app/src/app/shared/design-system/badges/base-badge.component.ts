import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

/**
 * Represents a single entry in a badge map: how a value should be displayed.
 */
export interface IBadgeMapEntry {
  /** Display label text (max 30 characters) */
  label: string;
  /** DaisyUI badge CSS class (e.g., badge-success, badge-warning) */
  cssClass: string;
  /** Optional Material Symbols icon name displayed before the label */
  icon?: string;
}

/** Valid badge size options */
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Abstract base badge component providing shared rendering logic for
 * all badge variants (status, priority, stage, risk).
 *
 * Subclasses provide a default badge map and a category name.
 */
@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export abstract class BaseBadgeComponent {
  /** The current value to display in the badge */
  readonly value = input<string | null | undefined>(undefined);

  /** Badge map overriding default mappings */
  readonly badgeMap = input<Record<string, IBadgeMapEntry> | undefined>(undefined);

  /** Badge size variant */
  readonly size = input<BadgeSize>('md');

  /** The category name for ARIA label (e.g., "Status", "Priority") */
  protected abstract readonly category: string;

  /** Default badge map provided by each subclass */
  protected abstract readonly defaultBadgeMap: Record<string, IBadgeMapEntry>;

  /** Resolved badge map (custom overrides default) */
  protected readonly resolvedMap = computed(() => this.badgeMap() ?? this.defaultBadgeMap);

  /** Whether the badge should render (false if value is null/empty) */
  readonly shouldRender = computed(() => {
    const val = this.value();
    return val !== null && val !== undefined && val !== '';
  });

  /** The resolved badge entry from the map, or null for fallback */
  readonly badgeEntry = computed((): IBadgeMapEntry | null => {
    const val = this.value();
    if (!val) return null;
    const map = this.resolvedMap();
    return Object.prototype.hasOwnProperty.call(map, val) ? map[val] : null;
  });

  /** The display label: from map or formatted from raw value */
  readonly displayLabel = computed((): string => {
    const entry = this.badgeEntry();
    if (entry) return entry.label;
    const val = this.value();
    if (!val) return '';
    return this.formatFallbackLabel(val);
  });

  /** The CSS class to apply: from map or badge-ghost for fallback */
  readonly cssClass = computed((): string => {
    const entry = this.badgeEntry();
    return entry ? entry.cssClass : 'badge-ghost';
  });

  /** The icon name (if any) from the badge entry */
  readonly icon = computed((): string | undefined => {
    const entry = this.badgeEntry();
    return entry?.icon;
  });

  /** The size CSS class */
  readonly sizeClass = computed((): string => {
    const s = this.size();
    switch (s) {
      case 'xs': return 'badge-xs';
      case 'sm': return 'badge-sm';
      case 'md': return 'badge-md';
      case 'lg': return 'badge-lg';
      default: return 'badge-md';
    }
  });

  /** ARIA label: "Category: Display Label" */
  readonly ariaLabel = computed((): string => {
    return `${this.category}: ${this.displayLabel()}`;
  });

  /**
   * Converts PascalCase or camelCase to space-separated words.
   * e.g., "UnderReview" → "Under Review", "inProgress" → "In Progress"
   */
  private formatFallbackLabel(value: string): string {
    if (!value) return '';
    // Insert space before uppercase letters that follow a lowercase letter or another uppercase followed by lowercase
    const spaced = value.replace(/([a-z])([A-Z])/g, '$1 $2')
                        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    // Capitalize first character
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  }
}
