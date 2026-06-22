import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NgControl,
  ValidationErrors,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

/** Negative number format options */
export type NegativeFormat = 'minus' | 'parentheses';

/** Display mode for the currency component */
export type CurrencyMode = 'display' | 'edit' | 'readonly';

/**
 * Currency display/edit component implementing ControlValueAccessor.
 *
 * Provides a currency value presentation with:
 * - GBP default with configurable currencyCode and symbol
 * - Thousand separators and configurable decimal precision (0–4)
 * - Negative format: minus prefix or parentheses
 * - Edit mode with character filtering (digits, single decimal, single leading minus)
 * - Null emission for empty/non-numeric input on blur
 * - Format-on-blur with parsed value emission
 *
 * Supported range: -999,999,999.9999 to 999,999,999.9999
 *
 * @requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
 */
@Component({
  selector: 'app-currency',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Display mode: read-only formatted text -->
    @if (mode === 'display') {
      <span
        class="text-base-content font-mono"
        [attr.aria-label]="ariaDisplayLabel()"
      >
        {{ formattedDisplay() }}
      </span>
    }

    <!-- Edit mode: input field with character filtering -->
    @if (mode === 'edit') {
      <div class="form-control w-full">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60 font-mono pointer-events-none">
            {{ symbol }}
          </span>
          <input
            type="text"
            inputmode="decimal"
            class="input input-bordered w-full pl-8 font-mono"
            [class.input-error]="showErrors()"
            [disabled]="isDisabled()"
            [attr.aria-label]="currencyCode + ' value'"
            [attr.aria-invalid]="ariaInvalid()"
            [attr.aria-disabled]="ariaDisabledAttr()"
            [value]="editDisplayValue()"
            (input)="onInput($event)"
            (blur)="onBlur($event)"
            (keydown)="onKeyDown($event)"
          />
        </div>

        <!-- Error Messages -->
        @if (showErrors()) {
          <div class="label" role="alert">
            @for (msg of errorMessages(); track msg) {
              <span class="label-text-alt text-error">{{ msg }}</span>
            }
          </div>
        }
      </div>
    }

    <!-- Readonly mode: disabled input with formatted value -->
    @if (mode === 'readonly') {
      <div class="form-control w-full">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60 font-mono pointer-events-none">
            {{ symbol }}
          </span>
          <input
            type="text"
            class="input input-bordered w-full pl-8 font-mono bg-base-200 cursor-not-allowed"
            disabled
            [value]="formattedReadonlyValue()"
            [attr.aria-label]="currencyCode + ' value (read-only)'"
            aria-disabled="true"
          />
        </div>
      </div>
    }
  `,
})
export class CurrencyDisplayComponent implements ControlValueAccessor, OnInit, OnDestroy {
  // ─── Inputs ──────────────────────────────────────────────────────────────────

  /** Currency code identifier */
  @Input() currencyCode = 'GBP';

  /** Currency symbol to display */
  @Input() symbol = '£';

  /** Number of decimal places (0–4), default 2 */
  @Input() decimalPrecision = 2;

  /** How to format negative values */
  @Input() negativeFormat: NegativeFormat = 'minus';

  /** Display mode */
  @Input() mode: CurrencyMode = 'display';

  // ─── Outputs ─────────────────────────────────────────────────────────────────

  @Output() valueChange = new EventEmitter<number | null>();

  // ─── Internal state ──────────────────────────────────────────────────────────

  /** The numeric value (null means no value) */
  private readonly internalValue = signal<number | null>(null);

  /** Raw edit text while user is typing */
  private readonly rawEditText = signal<string>('');

  /** Whether the input is currently focused (editing) */
  private readonly isEditing = signal(false);

  /** Whether the control has been touched */
  private readonly touched = signal(false);

  /** Control validation errors */
  private readonly controlErrors = signal<ValidationErrors | null>(null);

  /** Whether the control is disabled */
  private readonly isDisabledSignal = signal(false);

  // ─── ControlValueAccessor callbacks ──────────────────────────────────────────

  private onChangeFn: (value: number | null) => void = () => {};
  private onTouchedFn: () => void = () => {};

  // ─── NgControl injection ─────────────────────────────────────────────────────

  private readonly ngControl: NgControl | null;
  private readonly destroyRef = inject(DestroyRef);
  private statusSubscription: Subscription | null = null;

  constructor() {
    try {
      this.ngControl = inject(NgControl, { optional: true, self: true });
    } catch {
      this.ngControl = null;
    }

    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // ─── Computed properties ─────────────────────────────────────────────────────

  /** Formatted display string for display mode */
  readonly formattedDisplay = computed(() => {
    const val = this.internalValue();
    if (val === null || val === undefined) return '';
    return this.formatCurrency(val);
  });

  /** Formatted string for readonly input */
  readonly formattedReadonlyValue = computed(() => {
    const val = this.internalValue();
    if (val === null || val === undefined) return '';
    return this.formatNumber(val);
  });

  /** Display value in edit mode (formatted when not editing, raw when editing) */
  readonly editDisplayValue = computed(() => {
    if (this.isEditing()) {
      return this.rawEditText();
    }
    const val = this.internalValue();
    if (val === null || val === undefined) return '';
    return this.formatNumber(val);
  });

  /** ARIA label for display mode */
  readonly ariaDisplayLabel = computed(() => {
    const val = this.internalValue();
    if (val === null || val === undefined) return `${this.currencyCode}: no value`;
    return `${this.currencyCode}: ${this.formatCurrency(val)}`;
  });

  /** Whether errors should be visible */
  readonly showErrors = computed(() => {
    return this.touched() && this.controlErrors() !== null;
  });

  /** Error messages list */
  readonly errorMessages = computed<string[]>(() => {
    const errors = this.controlErrors();
    if (!errors) return [];
    return Object.keys(errors).map((key) => {
      const val = errors[key];
      if (typeof val === 'string') return val;
      return `Validation error: ${key}`;
    });
  });

  /** aria-invalid attribute value */
  readonly ariaInvalid = computed(() => {
    return this.controlErrors() !== null ? 'true' : undefined;
  });

  /** aria-disabled attribute value */
  readonly ariaDisabledAttr = computed(() => {
    return this.isDisabledSignal() ? 'true' : undefined;
  });

  /** Whether the control is disabled */
  isDisabled(): boolean {
    return this.isDisabledSignal();
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.syncControlErrors();
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  // ─── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(value: number | null): void {
    this.internalValue.set(value);
    if (!this.isEditing()) {
      this.rawEditText.set(value !== null && value !== undefined ? this.formatNumber(value) : '');
    }
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabledSignal.set(isDisabled);
  }

  // ─── Event handlers ──────────────────────────────────────────────────────────

  /**
   * Handle input event — filter characters to allow only:
   * - Digits (0-9)
   * - A single decimal point
   * - A single leading minus sign
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtered = this.filterInput(input.value);

    // Only update if filtering changed the value
    if (filtered !== input.value) {
      input.value = filtered;
    }

    this.rawEditText.set(filtered);
    this.isEditing.set(true);
  }

  /**
   * Handle blur event — format the value and emit
   */
  onBlur(_event: Event): void {
    this.isEditing.set(false);
    this.markAsTouched();

    const raw = this.rawEditText();
    const parsed = this.parseValue(raw);

    // Clamp to range
    const clamped = this.clampValue(parsed);

    // Update internal state
    this.internalValue.set(clamped);

    // Update the raw text to show formatted value
    if (clamped !== null) {
      this.rawEditText.set(this.formatNumber(clamped));
    } else {
      this.rawEditText.set('');
    }

    // Emit value
    this.onChangeFn(clamped);
    this.valueChange.emit(clamped);
    this.syncControlErrors();
  }

  /**
   * Prevent invalid characters from being typed
   */
  onKeyDown(event: KeyboardEvent): void {
    // Allow control keys
    if (
      event.key === 'Backspace' ||
      event.key === 'Delete' ||
      event.key === 'Tab' ||
      event.key === 'Escape' ||
      event.key === 'Enter' ||
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'ArrowUp' ||
      event.key === 'ArrowDown' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const currentValue = input.value;
    const selectionStart = input.selectionStart ?? 0;

    // Allow digits
    if (/^\d$/.test(event.key)) {
      return;
    }

    // Allow single decimal point
    if (event.key === '.') {
      if (currentValue.includes('.')) {
        event.preventDefault();
      }
      return;
    }

    // Allow minus only at the start (leading minus)
    if (event.key === '-') {
      if (currentValue.includes('-') || selectionStart !== 0) {
        event.preventDefault();
      }
      return;
    }

    // Block all other characters
    event.preventDefault();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Filter input string to only allow valid currency characters:
   * - Digits (0-9)
   * - At most one decimal point
   * - At most one leading minus sign
   */
  private filterInput(raw: string): string {
    let result = '';
    let hasDecimal = false;
    let hasMinus = false;

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i];

      if (char === '-') {
        // Only allow minus at position 0 of result, and only once
        if (!hasMinus && result.length === 0) {
          result += char;
          hasMinus = true;
        }
      } else if (char === '.') {
        // Only allow one decimal point
        if (!hasDecimal) {
          result += char;
          hasDecimal = true;
        }
      } else if (/^\d$/.test(char)) {
        result += char;
      }
      // All other characters are discarded
    }

    return result;
  }

  /**
   * Parse a raw string value into a number or null.
   * Returns null for empty, whitespace-only, or non-numeric values.
   */
  private parseValue(raw: string): number | null {
    if (!raw || raw.trim() === '') return null;

    const cleaned = raw.trim();

    // After filtering, try to parse
    const parsed = parseFloat(cleaned);
    if (isNaN(parsed)) return null;

    // Round to configured precision
    const factor = Math.pow(10, this.decimalPrecision);
    return Math.round(parsed * factor) / factor;
  }

  /**
   * Clamp value to the supported range: -999,999,999.9999 to 999,999,999.9999
   */
  private clampValue(value: number | null): number | null {
    if (value === null) return null;
    const MIN = -999999999.9999;
    const MAX = 999999999.9999;
    return Math.max(MIN, Math.min(MAX, value));
  }

  /**
   * Format a number with thousand separators and configured decimal precision.
   * Does NOT include the currency symbol (that's in the template).
   */
  private formatNumber(value: number): string {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    // Format with fixed decimal places
    const fixed = absValue.toFixed(this.decimalPrecision);

    // Add thousand separators to the integer part
    const [intPart, decPart] = fixed.split('.');
    const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let formatted = decPart !== undefined ? `${withSeparators}.${decPart}` : withSeparators;

    if (isNegative) {
      if (this.negativeFormat === 'parentheses') {
        formatted = `(${formatted})`;
      } else {
        formatted = `-${formatted}`;
      }
    }

    return formatted;
  }

  /**
   * Format a full currency string with symbol for display mode.
   */
  private formatCurrency(value: number): string {
    const isNegative = value < 0;
    const absValue = Math.abs(value);

    // Format with fixed decimal places
    const fixed = absValue.toFixed(this.decimalPrecision);

    // Add thousand separators to the integer part
    const [intPart, decPart] = fixed.split('.');
    const withSeparators = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let numStr = decPart !== undefined ? `${withSeparators}.${decPart}` : withSeparators;

    if (isNegative) {
      if (this.negativeFormat === 'parentheses') {
        return `(${this.symbol}${numStr})`;
      } else {
        return `-${this.symbol}${numStr}`;
      }
    }

    return `${this.symbol}${numStr}`;
  }

  /** Mark the control as touched */
  private markAsTouched(): void {
    if (!this.touched()) {
      this.touched.set(true);
      this.onTouchedFn();
    }
  }

  /** Sync errors from NgControl */
  private syncControlErrors(): void {
    if (this.ngControl?.control) {
      const control = this.ngControl.control;
      this.controlErrors.set(control.errors);

      if (!this.statusSubscription) {
        this.statusSubscription = control.statusChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.controlErrors.set(control.errors);
            this.touched.set(control.touched);
          });
      }
    }
  }
}
