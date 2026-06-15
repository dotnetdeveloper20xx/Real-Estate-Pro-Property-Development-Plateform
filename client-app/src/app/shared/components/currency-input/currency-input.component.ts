import {
  Component,
  ChangeDetectionStrategy,
  Input,
  forwardRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

/**
 * Reusable currency input component with £ prefix, comma formatting on blur,
 * and raw number editing on focus.
 *
 * Implements ControlValueAccessor to support [(ngModel)] and reactive forms.
 *
 * @example
 * ```html
 * <app-currency-input [(ngModel)]="amount" placeholder="e.g. 1,500,000"></app-currency-input>
 * ```
 */
@Component({
  selector: 'app-currency-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="join w-full">
      <span class="join-item flex items-center px-3 bg-base-200 border border-base-300 border-r-0 text-sm font-medium text-base-content/60">£</span>
      <input
        type="text"
        class="input input-bordered input-sm join-item w-full"
        [value]="displayValue"
        (focus)="onFocus()"
        (blur)="onBlur($event)"
        (input)="onInput($event)"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [attr.aria-label]="ariaLabel" />
    </div>
  `
})
export class CurrencyInputComponent implements ControlValueAccessor {
  @Input() placeholder = 'e.g. 1,500,000';
  @Input() ariaLabel = 'Currency amount';

  displayValue = '';
  disabled = false;

  private rawValue: number = 0;
  private isFocused = false;
  private onChange: (value: number) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: number | null): void {
    this.rawValue = value ?? 0;
    if (!this.isFocused) {
      this.displayValue = this.formatWithCommas(this.rawValue);
    } else {
      this.displayValue = this.rawValue ? this.rawValue.toString() : '';
    }
  }

  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFocus(): void {
    this.isFocused = true;
    this.displayValue = this.rawValue ? this.rawValue.toString() : '';
  }

  onBlur(event: Event): void {
    this.isFocused = false;
    const input = event.target as HTMLInputElement;
    const stripped = input.value.replace(/[^0-9.]/g, '');
    this.rawValue = stripped ? parseFloat(stripped) : 0;
    if (isNaN(this.rawValue)) {
      this.rawValue = 0;
    }
    this.displayValue = this.formatWithCommas(this.rawValue);
    this.onChange(this.rawValue);
    this.onTouched();
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const stripped = input.value.replace(/[^0-9.]/g, '');
    this.rawValue = stripped ? parseFloat(stripped) : 0;
    if (isNaN(this.rawValue)) {
      this.rawValue = 0;
    }
    this.onChange(this.rawValue);
  }

  private formatWithCommas(value: number): string {
    if (!value || value === 0) return '';
    return value.toLocaleString('en-GB', { maximumFractionDigits: 2 });
  }
}
