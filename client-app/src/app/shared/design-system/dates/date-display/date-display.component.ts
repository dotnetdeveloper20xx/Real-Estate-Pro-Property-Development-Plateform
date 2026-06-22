import { Component, ChangeDetectionStrategy, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Date display component (`app-date`).
 *
 * Displays a formatted date value using a configurable locale (default: en-GB → DD/MM/YYYY).
 * Optionally shows relative time (e.g., "2 days ago") when the date is within 30 days.
 *
 * @requirements 7.1, 7.2, 7.3, 7.6
 */
@Component({
  selector: 'app-date',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (displayValue()) {
      <time [attr.datetime]="isoValue()" [attr.title]="absoluteDisplay()">
        {{ displayValue() }}
      </time>
    }
  `,
})
export class DateDisplayComponent {
  /** ISO 8601 string (YYYY-MM-DD) or Date object or null */
  @Input()
  set value(val: string | Date | null) {
    this._value.set(val);
  }

  /** Locale for date formatting. Default: 'en-GB' → DD/MM/YYYY */
  @Input()
  set locale(val: string) {
    this._locale.set(val);
  }

  /** When true, shows relative time (e.g., "2 days ago") for dates within 30 days */
  @Input()
  set relative(val: boolean) {
    this._relative.set(val);
  }

  private readonly _value = signal<string | Date | null>(null);
  private readonly _locale = signal<string>('en-GB');
  private readonly _relative = signal<boolean>(false);

  /** Parsed Date object from input value */
  readonly parsedDate = computed<Date | null>(() => {
    const val = this._value();
    if (!val) return null;
    if (val instanceof Date) {
      return isNaN(val.getTime()) ? null : val;
    }
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  });

  /** ISO date string for the datetime attribute */
  readonly isoValue = computed<string>(() => {
    const date = this.parsedDate();
    if (!date) return '';
    return date.toISOString().slice(0, 10);
  });

  /** Formatted absolute date display */
  readonly absoluteDisplay = computed<string>(() => {
    const date = this.parsedDate();
    if (!date) return '';
    return this.formatDate(date, this._locale());
  });

  /** Final display value — relative or absolute */
  readonly displayValue = computed<string>(() => {
    const date = this.parsedDate();
    if (!date) return '';

    if (this._relative()) {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

      if (diffDays <= 30) {
        return this.getRelativeLabel(diffMs);
      }
    }

    return this.absoluteDisplay();
  });

  /**
   * Format a date according to the specified locale.
   */
  private formatDate(date: Date, locale: string): string {
    try {
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      // Fallback for invalid locale
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }

  /**
   * Generate a relative time label (e.g., "2 days ago", "in 3 days").
   */
  private getRelativeLabel(diffMs: number): string {
    const absDiffMs = Math.abs(diffMs);
    const isPast = diffMs > 0;

    const minutes = Math.floor(absDiffMs / (1000 * 60));
    const hours = Math.floor(absDiffMs / (1000 * 60 * 60));
    const days = Math.floor(absDiffMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);

    if (days === 0) {
      if (minutes < 1) {
        return 'just now';
      }
      if (hours < 1) {
        return isPast
          ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
          : `in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      }
      return isPast
        ? `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
        : `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    if (days === 1) {
      return isPast ? 'yesterday' : 'tomorrow';
    }

    if (days < 7) {
      return isPast ? `${days} days ago` : `in ${days} days`;
    }

    if (weeks <= 4) {
      return isPast
        ? `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
        : `in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }

    // Shouldn't reach here for <= 30 days, but fallback
    return isPast ? `${days} days ago` : `in ${days} days`;
  }
}
