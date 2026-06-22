import {
  Directive,
  Input,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  DestroyRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  NgControl,
  ValidationErrors,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

/**
 * Abstract base class for all design-system form control wrappers.
 *
 * Provides:
 * - ControlValueAccessor integration with Angular Reactive Forms
 * - Unique ID generation for label association
 * - ARIA attribute management (aria-describedby, aria-invalid, aria-disabled)
 * - Required indicator (asterisk) logic
 * - Character counter logic (currentLength / maxLength)
 * - Error visibility (touched + has errors)
 *
 * Subclasses provide their own template and selector — this class handles
 * all shared form control behaviour.
 *
 * @requirements 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11
 */
@Directive()
export abstract class BaseFormControl<T = unknown>
  implements ControlValueAccessor, OnInit, OnDestroy
{
  // ─── Static counter for unique IDs ───────────────────────────────────────────
  private static nextId = 0;

  // ─── Inputs ──────────────────────────────────────────────────────────────────
  @Input() label = '';
  @Input() placeholder = '';
  @Input() helpText = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() maxLength: number | undefined;

  // ─── Unique ID for label association ─────────────────────────────────────────
  readonly controlId: string;
  readonly helpTextId: string;
  readonly errorId: string;

  // ─── Internal signals ────────────────────────────────────────────────────────
  protected readonly value = signal<T | null>(null);
  protected readonly touched = signal(false);
  protected readonly controlErrors = signal<ValidationErrors | null>(null);
  protected readonly isDisabled = signal(false);

  // ─── ControlValueAccessor callbacks ──────────────────────────────────────────
  protected onChange: (value: T | null) => void = () => {};
  protected onTouched: () => void = () => {};

  // ─── Injected dependencies ───────────────────────────────────────────────────
  protected readonly ngControl: NgControl | null;
  private readonly destroyRef = inject(DestroyRef);
  private statusSubscription: Subscription | null = null;

  constructor() {
    const id = ++BaseFormControl.nextId;
    this.controlId = `ds-fc-${id}`;
    this.helpTextId = `ds-fc-${id}-help`;
    this.errorId = `ds-fc-${id}-error`;

    // Attempt to inject NgControl (optional + self).
    // We use a try-catch because @Optional() @Self() inject may throw
    // if there's no provider in strict DI contexts.
    try {
      this.ngControl = inject(NgControl, { optional: true, self: true });
    } catch {
      this.ngControl = null;
    }

    // If NgControl is available, set this class as the value accessor
    // so Angular doesn't require a separate NG_VALUE_ACCESSOR provider.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  // ─── Computed properties ─────────────────────────────────────────────────────

  /** Whether errors should be shown (touched AND has errors) */
  readonly showErrors = computed(() => {
    return this.touched() && this.controlErrors() !== null;
  });

  /** List of error messages to display */
  readonly errorMessages = computed<string[]>(() => {
    const errors = this.controlErrors();
    if (!errors) return [];
    return Object.keys(errors).map((key) => this.mapErrorMessage(key, errors[key]));
  });

  /** aria-invalid attribute value */
  readonly ariaInvalid = computed(() => {
    return this.controlErrors() !== null ? 'true' : undefined;
  });

  /** aria-disabled attribute value */
  readonly ariaDisabledAttr = computed(() => {
    return this.isDisabled() ? 'true' : undefined;
  });

  /** aria-describedby string referencing help text and/or error elements */
  ariaDescribedBy(): string | undefined {
    const parts: string[] = [];
    if (this.helpText) {
      parts.push(this.helpTextId);
    }
    if (this.showErrors()) {
      parts.push(this.errorId);
    }
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  /** Character counter display string */
  readonly characterCount = computed(() => {
    if (this.maxLength === undefined) return undefined;
    const val = this.value();
    const currentLength = typeof val === 'string' ? val.length : 0;
    return `${currentLength}/${this.maxLength}`;
  });

  /** Current length of the value (for character counter) */
  readonly currentLength = computed(() => {
    const val = this.value();
    return typeof val === 'string' ? val.length : 0;
  });

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.syncControlErrors();
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  // ─── ControlValueAccessor implementation ─────────────────────────────────────

  writeValue(value: T | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // ─── Public methods for subclass templates ───────────────────────────────────

  /** Mark the control as touched (call on blur) */
  markAsTouched(): void {
    if (!this.touched()) {
      this.touched.set(true);
      this.onTouched();
    }
  }

  /** Update the internal value and notify Angular forms */
  updateValue(newValue: T | null): void {
    this.value.set(newValue);
    this.onChange(newValue);
    this.syncControlErrors();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Synchronise the error state from NgControl.
   * Called after value changes and on init to capture current validation errors.
   */
  private syncControlErrors(): void {
    if (this.ngControl?.control) {
      const control = this.ngControl.control;
      this.controlErrors.set(control.errors);

      // Subscribe to status changes if not already subscribed
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

  /**
   * Map a validation error key to a human-readable message.
   * Subclasses can override this to provide custom error messages.
   */
  protected mapErrorMessage(errorKey: string, errorValue: unknown): string {
    switch (errorKey) {
      case 'required':
        return `${this.label || 'This field'} is required.`;
      case 'minlength': {
        const err = errorValue as { requiredLength: number; actualLength: number };
        return `Minimum ${err.requiredLength} characters required.`;
      }
      case 'maxlength': {
        const err = errorValue as { requiredLength: number; actualLength: number };
        return `Maximum ${err.requiredLength} characters allowed.`;
      }
      case 'min': {
        const err = errorValue as { min: number; actual: number };
        return `Minimum value is ${err.min}.`;
      }
      case 'max': {
        const err = errorValue as { max: number; actual: number };
        return `Maximum value is ${err.max}.`;
      }
      case 'email':
        return 'Please enter a valid email address.';
      case 'pattern':
        return 'Invalid format.';
      default:
        // If the error value is a string, use it directly
        if (typeof errorValue === 'string') {
          return errorValue;
        }
        return `Validation error: ${errorKey}`;
    }
  }
}
