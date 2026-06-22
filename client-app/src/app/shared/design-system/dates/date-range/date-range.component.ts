import {
  Component,
  ChangeDetectionStrategy,
  Input,
  signal,
  computed,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  Validator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

/**
 * Date range component (`app-date-range`).
 *
 * Implements ControlValueAccessor emitting `{ start: string; end: string }`.
 * Validates that end date >= start date.
 * Uses native date inputs internally for start and end dates.
 *
 * @requirements 7.1, 7.7, 7.8, 7.10
 */
@Component({
  selector: 'app-date-range',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateRangeComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateRangeComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-control w-full">
      <!-- Label -->
      @if (label) {
        <label class="label">
          <span class="label-text">
            {{ label }}
            @if (required) {
              <span class="text-error" aria-hidden="true">*</span>
            }
          </span>
        </label>
      }

      <!-- Date Range Inputs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Start Date -->
        <div class="form-control w-full">
          <label class="label" [attr.for]="startId">
            <span class="label-text text-sm">{{ startLabel }}</span>
          </label>
          <input
            type="text"
            [id]="startId"
            class="input input-bordered w-full"
            [class.input-error]="showStartError()"
            [placeholder]="startPlaceholderText()"
            [disabled]="isDisabled()"
            [readonly]="readonly"
            [attr.aria-invalid]="showStartError() ? 'true' : undefined"
            [attr.aria-required]="required || undefined"
            [value]="startDisplayValue()"
            (input)="onStartInput($event)"
            (blur)="onBlur()"
          />
          @if (showStartError()) {
            <div class="label" role="alert">
              <span class="label-text-alt text-error">{{ startErrorMessage() }}</span>
            </div>
          }
        </div>

        <!-- End Date -->
        <div class="form-control w-full">
          <label class="label" [attr.for]="endId">
            <span class="label-text text-sm">{{ endLabel }}</span>
          </label>
          <input
            type="text"
            [id]="endId"
            class="input input-bordered w-full"
            [class.input-error]="showEndError()"
            [placeholder]="endPlaceholderText()"
            [disabled]="isDisabled()"
            [readonly]="readonly"
            [attr.aria-invalid]="showEndError() ? 'true' : undefined"
            [attr.aria-required]="required || undefined"
            [value]="endDisplayValue()"
            (input)="onEndInput($event)"
            (blur)="onBlur()"
          />
          @if (showEndError()) {
            <div class="label" role="alert">
              <span class="label-text-alt text-error">{{ endErrorMessage() }}</span>
            </div>
          }
        </div>
      </div>

      <!-- Range validation error -->
      @if (showRangeError()) {
        <div class="label" role="alert">
          <span class="label-text-alt text-error">
            End date must be equal to or later than the start date.
          </span>
        </div>
      }

      <!-- Help Text -->
      @if (helpText) {
        <div class="label">
          <span class="label-text-alt text-base-content/60">{{ helpText }}</span>
        </div>
      }
    </div>
  `,
})
export class DateRangeComponent implements ControlValueAccessor, Validator {
  private static nextId = 0;

  // ─── Inputs ──────────────────────────────────────────────────────────────────
  @Input() label = '';
  @Input() startLabel = 'Start Date';
  @Input() endLabel = 'End Date';
  @Input() helpText = '';
  @Input() required = false;
  @Input() readonly = false;
  @Input() minDate: string | null = null;
  @Input() maxDate: string | null = null;
  @Input() locale = 'en-GB';

  // ─── IDs ─────────────────────────────────────────────────────────────────────
  readonly startId: string;
  readonly endId: string;

  // ─── Internal state ──────────────────────────────────────────────────────────
  private readonly _startValue = signal<string | null>(null); // ISO YYYY-MM-DD
  private readonly _endValue = signal<string | null>(null);   // ISO YYYY-MM-DD
  private readonly _startRawInvalid = signal(false);
  private readonly _endRawInvalid = signal(false);
  private readonly _touched = signal(false);
  readonly isDisabled = signal(false);

  // ─── ControlValueAccessor callbacks ──────────────────────────────────────────
  private onChange: (value: IDateRangeValue | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  constructor() {
    const id = ++DateRangeComponent.nextId;
    this.startId = `ds-daterange-start-${id}`;
    this.endId = `ds-daterange-end-${id}`;
  }

  // ─── Computed properties ─────────────────────────────────────────────────────

  readonly startPlaceholderText = computed(() => {
    if (this.locale === 'en-US') return 'MM/DD/YYYY';
    return 'DD/MM/YYYY';
  });

  readonly endPlaceholderText = computed(() => {
    if (this.locale === 'en-US') return 'MM/DD/YYYY';
    return 'DD/MM/YYYY';
  });

  /** Display value for start date input */
  readonly startDisplayValue = computed(() => {
    const iso = this._startValue();
    if (!iso) return '';
    const date = this.parseIsoDate(iso);
    if (!date) return '';
    return this.formatDateForDisplay(date);
  });

  /** Display value for end date input */
  readonly endDisplayValue = computed(() => {
    const iso = this._endValue();
    if (!iso) return '';
    const date = this.parseIsoDate(iso);
    if (!date) return '';
    return this.formatDateForDisplay(date);
  });

  /** Whether the range is invalid (end < start) */
  readonly rangeInvalid = computed<boolean>(() => {
    const start = this._startValue();
    const end = this._endValue();
    if (!start || !end) return false;
    return end < start;
  });

  /** Whether to show the range error */
  readonly showRangeError = computed<boolean>(() => {
    return this._touched() && this.rangeInvalid();
  });

  /** Whether to show start error */
  readonly showStartError = computed<boolean>(() => {
    return this._touched() && this._startRawInvalid();
  });

  /** Start error message */
  readonly startErrorMessage = computed<string>(() => {
    if (this._startRawInvalid()) {
      return `Please enter a valid date (${this.startPlaceholderText()}).`;
    }
    return '';
  });

  /** Whether to show end error */
  readonly showEndError = computed<boolean>(() => {
    return this._touched() && this._endRawInvalid();
  });

  /** End error message */
  readonly endErrorMessage = computed<string>(() => {
    if (this._endRawInvalid()) {
      return `Please enter a valid date (${this.endPlaceholderText()}).`;
    }
    return '';
  });

  // ─── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(value: IDateRangeValue | null): void {
    if (value) {
      this._startValue.set(value.start || null);
      this._endValue.set(value.end || null);
    } else {
      this._startValue.set(null);
      this._endValue.set(null);
    }
    this._startRawInvalid.set(false);
    this._endRawInvalid.set(false);
  }

  registerOnChange(fn: (value: IDateRangeValue | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // ─── Validator ───────────────────────────────────────────────────────────────

  validate(_control: AbstractControl): ValidationErrors | null {
    if (this.rangeInvalid()) {
      return { dateRange: 'End date must be equal to or later than the start date.' };
    }
    if (this._startRawInvalid() || this._endRawInvalid()) {
      return { invalidDate: 'Please enter valid dates.' };
    }
    return null;
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // ─── Template methods ────────────────────────────────────────────────────────

  onStartInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.trim();

    if (!rawValue) {
      this._startValue.set(null);
      this._startRawInvalid.set(false);
      this.emitValue();
      return;
    }

    const parsed = this.parseLocaleDate(rawValue);
    if (parsed) {
      this._startValue.set(this.toIsoString(parsed));
      this._startRawInvalid.set(false);
    } else {
      this._startValue.set(null);
      this._startRawInvalid.set(true);
    }
    this.emitValue();
    this.onValidatorChange();
  }

  onEndInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.trim();

    if (!rawValue) {
      this._endValue.set(null);
      this._endRawInvalid.set(false);
      this.emitValue();
      return;
    }

    const parsed = this.parseLocaleDate(rawValue);
    if (parsed) {
      this._endValue.set(this.toIsoString(parsed));
      this._endRawInvalid.set(false);
    } else {
      this._endValue.set(null);
      this._endRawInvalid.set(true);
    }
    this.emitValue();
    this.onValidatorChange();
  }

  onBlur(): void {
    if (!this._touched()) {
      this._touched.set(true);
      this.onTouched();
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private emitValue(): void {
    const start = this._startValue();
    const end = this._endValue();

    // Don't emit invalid ranges
    if (start && end && end < start) {
      this.onChange(null);
      return;
    }

    if (start || end) {
      this.onChange({ start: start || '', end: end || '' });
    } else {
      this.onChange(null);
    }
  }

  private parseIsoDate(value: string): Date | null {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    return null;
  }

  private parseLocaleDate(value: string): Date | null {
    // Try DD/MM/YYYY for en-GB (default)
    if (this.locale.startsWith('en-GB') || this.locale.includes('GB') || !this.locale.startsWith('en-US')) {
      const match = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const year = parseInt(match[3], 10);
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return date;
        }
      }
    } else {
      // Try MM/DD/YYYY for en-US
      const match = value.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (match) {
        const month = parseInt(match[1], 10) - 1;
        const day = parseInt(match[2], 10);
        const year = parseInt(match[3], 10);
        const date = new Date(year, month, day);
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
          return date;
        }
      }
    }

    // Also try ISO format YYYY-MM-DD
    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }

    return null;
  }

  private formatDateForDisplay(date: Date): string {
    try {
      return date.toLocaleDateString(this.locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }

  private toIsoString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

/** Value shape emitted by the date range component */
export interface IDateRangeValue {
  start: string;
  end: string;
}
