import {
  Component,
  ChangeDetectionStrategy,
  Input,
  signal,
  computed,
  HostListener,
  ElementRef,
  inject,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  AbstractControl,
  Validator,
  NG_VALIDATORS,
} from '@angular/forms';

/**
 * Date picker component (`app-date-picker`).
 *
 * Implements ControlValueAccessor for Angular Reactive Forms integration.
 * Provides a text input with calendar popup, min/max constraints, keyboard navigation,
 * and emits ISO 8601 date strings (YYYY-MM-DD).
 *
 * @requirements 7.1, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
 */
@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-control w-full relative">
      <!-- Label -->
      @if (label) {
        <label class="label" [attr.for]="controlId">
          <span class="label-text">
            {{ label }}
            @if (required) {
              <span class="text-error" aria-hidden="true">*</span>
            }
          </span>
        </label>
      }

      <!-- Input with calendar toggle -->
      <div class="relative">
        <input
          type="text"
          [id]="controlId"
          class="input input-bordered w-full pr-10"
          [class.input-error]="showErrors()"
          [placeholder]="inputPlaceholder()"
          [disabled]="isDisabled() || readonly"
          [readonly]="readonly"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="showErrors() ? 'true' : undefined"
          [attr.aria-disabled]="isDisabled() ? 'true' : undefined"
          [attr.aria-required]="required || undefined"
          [value]="displayValue()"
          (input)="onTextInput($event)"
          (blur)="onBlur()"
          (keydown.enter)="toggleCalendar()"
          (keydown.escape)="closeCalendar()"
        />
        @if (!readonly && !isDisabled()) {
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
            (click)="toggleCalendar()"
            [attr.aria-label]="calendarOpen() ? 'Close calendar' : 'Open calendar'"
            tabindex="-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        }
      </div>

      <!-- Calendar Popup -->
      @if (calendarOpen()) {
        <div
          class="absolute z-50 mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg p-3 w-72"
          role="dialog"
          aria-modal="true"
          aria-label="Date picker calendar"
          (keydown)="onCalendarKeydown($event)"
        >
          <!-- Calendar Header -->
          <div class="flex items-center justify-between mb-2">
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              (click)="previousMonth()"
              aria-label="Previous month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span class="font-semibold text-sm">
              {{ calendarMonthLabel() }}
            </span>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              (click)="nextMonth()"
              aria-label="Next month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <!-- Day Headers -->
          <div class="grid grid-cols-7 gap-0 text-center mb-1">
            @for (day of weekDays; track day) {
              <div class="text-xs font-medium text-base-content/60 py-1">{{ day }}</div>
            }
          </div>

          <!-- Calendar Days -->
          <div class="grid grid-cols-7 gap-0">
            @for (day of calendarDays(); track day.key) {
              <button
                type="button"
                class="btn btn-ghost btn-xs h-8 w-8 p-0 text-xs rounded-full"
                [class.btn-primary]="day.isSelected"
                [class.text-primary]="day.isToday && !day.isSelected"
                [class.font-bold]="day.isToday"
                [class.opacity-30]="!day.isCurrentMonth"
                [class.btn-disabled]="day.isDisabled"
                [disabled]="day.isDisabled"
                [attr.aria-label]="day.ariaLabel"
                [attr.aria-selected]="day.isSelected"
                [attr.aria-disabled]="day.isDisabled"
                (click)="selectDay(day)"
              >
                {{ day.dayNumber }}
              </button>
            }
          </div>

          <!-- Today button -->
          <div class="flex justify-center mt-2 pt-2 border-t border-base-300">
            <button
              type="button"
              class="btn btn-ghost btn-xs"
              (click)="selectToday()"
            >
              Today
            </button>
          </div>
        </div>
      }

      <!-- Help Text -->
      @if (helpText) {
        <div class="label" [id]="helpTextId">
          <span class="label-text-alt text-base-content/60">{{ helpText }}</span>
        </div>
      }

      <!-- Error Messages -->
      @if (showErrors()) {
        <div class="label" [id]="errorId" role="alert">
          @for (msg of errorMessages(); track msg) {
            <span class="label-text-alt text-error">{{ msg }}</span>
          }
        </div>
      }
    </div>
  `,
})
export class DatePickerComponent implements ControlValueAccessor, Validator {
  private static nextId = 0;

  // ─── Inputs ──────────────────────────────────────────────────────────────────
  @Input() label = '';
  @Input() placeholder = '';
  @Input() helpText = '';
  @Input() required = false;
  @Input() readonly = false;

  @Input()
  set minDate(val: string | null) {
    this._minDate.set(val ? this.parseIsoDate(val) : null);
  }

  @Input()
  set maxDate(val: string | null) {
    this._maxDate.set(val ? this.parseIsoDate(val) : null);
  }

  @Input()
  set locale(val: string) {
    this._locale.set(val);
  }

  // ─── IDs ─────────────────────────────────────────────────────────────────────
  readonly controlId: string;
  readonly helpTextId: string;
  readonly errorId: string;

  // ─── Internal state ──────────────────────────────────────────────────────────
  private readonly _value = signal<string | null>(null); // ISO YYYY-MM-DD
  private readonly _locale = signal<string>('en-GB');
  private readonly _minDate = signal<Date | null>(null);
  private readonly _maxDate = signal<Date | null>(null);
  private readonly _touched = signal(false);
  private readonly _internalErrors = signal<ValidationErrors | null>(null);
  readonly isDisabled = signal(false);
  readonly calendarOpen = signal(false);
  private readonly _viewMonth = signal<Date>(new Date());
  private readonly elementRef = inject(ElementRef);

  // ─── ControlValueAccessor callbacks ──────────────────────────────────────────
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  readonly weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  constructor() {
    const id = ++DatePickerComponent.nextId;
    this.controlId = `ds-date-${id}`;
    this.helpTextId = `ds-date-${id}-help`;
    this.errorId = `ds-date-${id}-error`;
  }

  // ─── Computed ────────────────────────────────────────────────────────────────

  /** Placeholder based on locale */
  readonly inputPlaceholder = computed(() => {
    if (this.placeholder) return this.placeholder;
    const locale = this._locale();
    if (locale === 'en-US') return 'MM/DD/YYYY';
    return 'DD/MM/YYYY';
  });

  /** Display value formatted for the user's locale */
  readonly displayValue = computed(() => {
    const iso = this._value();
    if (!iso) return '';
    const date = this.parseIsoDate(iso);
    if (!date) return '';
    return this.formatDateForDisplay(date);
  });

  /** Month/Year label for the calendar header */
  readonly calendarMonthLabel = computed(() => {
    const viewMonth = this._viewMonth();
    return viewMonth.toLocaleDateString(this._locale(), {
      month: 'long',
      year: 'numeric',
    });
  });

  /** Calendar days grid */
  readonly calendarDays = computed(() => {
    const viewMonth = this._viewMonth();
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const selectedIso = this._value();
    const today = new Date();
    const minDate = this._minDate();
    const maxDate = this._maxDate();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Day of week (Monday = 0)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const days: ICalendarDay[] = [];

    // Previous month fill
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(year, month - 1, dayNum);
      days.push(this.createCalendarDay(date, false, selectedIso, today, minDate, maxDate));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push(this.createCalendarDay(date, true, selectedIso, today, minDate, maxDate));
    }

    // Next month fill to complete 6 rows (42 cells)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push(this.createCalendarDay(date, false, selectedIso, today, minDate, maxDate));
    }

    return days;
  });

  /** Whether to show errors */
  readonly showErrors = computed(() => {
    return this._touched() && this._internalErrors() !== null;
  });

  /** Error messages list */
  readonly errorMessages = computed<string[]>(() => {
    const errors = this._internalErrors();
    if (!errors) return [];
    const messages: string[] = [];
    if (errors['invalidDate']) {
      messages.push(errors['invalidDate'] as string);
    }
    if (errors['minDate']) {
      messages.push(errors['minDate'] as string);
    }
    if (errors['maxDate']) {
      messages.push(errors['maxDate'] as string);
    }
    if (errors['required']) {
      messages.push(`${this.label || 'Date'} is required.`);
    }
    return messages;
  });

  // ─── ControlValueAccessor ────────────────────────────────────────────────────

  writeValue(value: string | null): void {
    this._value.set(value);
    if (value) {
      const date = this.parseIsoDate(value);
      if (date) {
        this._viewMonth.set(new Date(date.getFullYear(), date.getMonth(), 1));
      }
    }
    this.validateInternal();
  }

  registerOnChange(fn: (value: string | null) => void): void {
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
    return this._internalErrors();
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  // ─── Template methods ────────────────────────────────────────────────────────

  ariaDescribedBy(): string | undefined {
    const parts: string[] = [];
    if (this.helpText) parts.push(this.helpTextId);
    if (this.showErrors()) parts.push(this.errorId);
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  onTextInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const rawValue = input.value.trim();

    if (!rawValue) {
      this._value.set(null);
      this.validateInternal();
      this.onChange(null);
      return;
    }

    // Try to parse the input in locale format
    const parsed = this.parseLocaleDate(rawValue);
    if (parsed) {
      const iso = this.toIsoString(parsed);
      this._value.set(iso);
      this._viewMonth.set(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      this.validateInternal();
      if (!this._internalErrors()) {
        this.onChange(iso);
      } else {
        this.onChange(null);
      }
    } else {
      // Invalid date input
      this._value.set(null);
      this._internalErrors.set({
        invalidDate: `Please enter a valid date (${this.inputPlaceholder()}).`,
      });
      this.onChange(null);
      this.onValidatorChange();
    }
  }

  onBlur(): void {
    if (!this._touched()) {
      this._touched.set(true);
      this.onTouched();
    }
  }

  toggleCalendar(): void {
    if (this.readonly || this.isDisabled()) return;
    this.calendarOpen.set(!this.calendarOpen());
    if (this.calendarOpen()) {
      // Set view to current value month or today
      const val = this._value();
      if (val) {
        const date = this.parseIsoDate(val);
        if (date) {
          this._viewMonth.set(new Date(date.getFullYear(), date.getMonth(), 1));
        }
      } else {
        this._viewMonth.set(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      }
    }
  }

  closeCalendar(): void {
    this.calendarOpen.set(false);
  }

  previousMonth(): void {
    const current = this._viewMonth();
    this._viewMonth.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const current = this._viewMonth();
    this._viewMonth.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectDay(day: ICalendarDay): void {
    if (day.isDisabled) return;
    const iso = this.toIsoString(day.date);
    this._value.set(iso);
    this._viewMonth.set(new Date(day.date.getFullYear(), day.date.getMonth(), 1));
    this.validateInternal();
    if (!this._internalErrors()) {
      this.onChange(iso);
    }
    this.closeCalendar();
    if (!this._touched()) {
      this._touched.set(true);
      this.onTouched();
    }
  }

  selectToday(): void {
    const today = new Date();
    const iso = this.toIsoString(today);
    this._value.set(iso);
    this._viewMonth.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.validateInternal();
    if (!this._internalErrors()) {
      this.onChange(iso);
    }
    this.closeCalendar();
    if (!this._touched()) {
      this._touched.set(true);
      this.onTouched();
    }
  }

  onCalendarKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.closeCalendar();
        event.preventDefault();
        break;
      case 'ArrowLeft':
        this.navigateDay(-1);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.navigateDay(1);
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.navigateDay(-7);
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.navigateDay(7);
        event.preventDefault();
        break;
      case 'Enter':
        // Select the current focused day
        const val = this._value();
        if (val) {
          const date = this.parseIsoDate(val);
          if (date && !this.isDateDisabled(date)) {
            this.closeCalendar();
          }
        }
        event.preventDefault();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.calendarOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeCalendar();
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private navigateDay(offset: number): void {
    const currentVal = this._value();
    let baseDate: Date;
    if (currentVal) {
      const parsed = this.parseIsoDate(currentVal);
      baseDate = parsed || new Date();
    } else {
      baseDate = new Date();
    }

    const newDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + offset);
    const iso = this.toIsoString(newDate);
    this._value.set(iso);
    this._viewMonth.set(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    this.validateInternal();
    if (!this._internalErrors()) {
      this.onChange(iso);
    }
  }

  private validateInternal(): void {
    const val = this._value();
    const errors: ValidationErrors = {};

    if (!val) {
      if (this.required) {
        errors['required'] = true;
      }
      this._internalErrors.set(Object.keys(errors).length > 0 ? errors : null);
      this.onValidatorChange();
      return;
    }

    const date = this.parseIsoDate(val);
    if (!date) {
      errors['invalidDate'] = `Please enter a valid date (${this.inputPlaceholder()}).`;
      this._internalErrors.set(errors);
      this.onValidatorChange();
      return;
    }

    const minDate = this._minDate();
    const maxDate = this._maxDate();

    if (minDate && date < this.startOfDay(minDate)) {
      const formattedMin = this.formatDateForDisplay(minDate);
      errors['minDate'] = `Date must be on or after ${formattedMin}.`;
    }

    if (maxDate && date > this.endOfDay(maxDate)) {
      const formattedMax = this.formatDateForDisplay(maxDate);
      errors['maxDate'] = `Date must be on or before ${formattedMax}.`;
    }

    this._internalErrors.set(Object.keys(errors).length > 0 ? errors : null);
    this.onValidatorChange();
  }

  private isDateDisabled(date: Date): boolean {
    const minDate = this._minDate();
    const maxDate = this._maxDate();
    if (minDate && date < this.startOfDay(minDate)) return true;
    if (maxDate && date > this.endOfDay(maxDate)) return true;
    return false;
  }

  private createCalendarDay(
    date: Date,
    isCurrentMonth: boolean,
    selectedIso: string | null,
    today: Date,
    minDate: Date | null,
    maxDate: Date | null
  ): ICalendarDay {
    const iso = this.toIsoString(date);
    const todayIso = this.toIsoString(today);
    const isDisabled =
      (minDate !== null && date < this.startOfDay(minDate)) ||
      (maxDate !== null && date > this.endOfDay(maxDate));

    return {
      date,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isSelected: selectedIso === iso,
      isToday: todayIso === iso,
      isDisabled,
      ariaLabel: date.toLocaleDateString(this._locale(), {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      key: iso + (isCurrentMonth ? '-curr' : '-other'),
    };
  }

  private parseIsoDate(value: string): Date | null {
    // Parse YYYY-MM-DD format
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
    const locale = this._locale();

    // Try DD/MM/YYYY for en-GB and similar locales
    if (locale.startsWith('en-GB') || locale.includes('GB')) {
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
    } else if (locale.startsWith('en-US') || locale.includes('US')) {
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
    } else {
      // Try DD/MM/YYYY as default fallback
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
      return date.toLocaleDateString(this._locale(), {
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

  private startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private endOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  }
}

/** Internal interface for calendar day cells */
interface ICalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  ariaLabel: string;
  key: string;
}
