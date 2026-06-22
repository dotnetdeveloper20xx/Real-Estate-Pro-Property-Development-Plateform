import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFormControl } from '../shared/base-form-control';

/**
 * Select form control component.
 *
 * Wraps a native `<select>` element with DaisyUI styling and full
 * ControlValueAccessor integration. Provides consistent label, help text,
 * error display, and ARIA attributes via BaseFormControl.
 *
 * @requirements 5.1, 5.11
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-control w-full">
      <!-- Label -->
      <label class="label" [attr.for]="controlId">
        <span class="label-text">
          {{ label }}
          @if (required) {
            <span class="text-error" aria-hidden="true">*</span>
          }
        </span>
      </label>

      <!-- Select -->
      <select
        class="select select-bordered w-full"
        [class.select-error]="showErrors()"
        [id]="controlId"
        [disabled]="isDisabled()"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-invalid]="ariaInvalid()"
        [attr.aria-disabled]="ariaDisabledAttr()"
        [attr.aria-required]="required || undefined"
        (change)="onSelectChange($event)"
        (blur)="markAsTouched()"
      >
        @if (placeholder) {
          <option value="" disabled [selected]="!value()">{{ placeholder }}</option>
        }
        @for (option of options; track option.value) {
          <option [value]="option.value" [selected]="option.value === value()">
            {{ option.label }}
          </option>
        }
      </select>

      <!-- Help Text -->
      @if (helpText) {
        <label class="label" [id]="helpTextId">
          <span class="label-text-alt">{{ helpText }}</span>
        </label>
      }

      <!-- Error Messages -->
      @if (showErrors()) {
        <label class="label" [id]="errorId">
          @for (msg of errorMessages(); track msg) {
            <span class="label-text-alt text-error">{{ msg }}</span>
          }
        </label>
      }
    </div>
  `,
})
export class SelectComponent extends BaseFormControl<string> {
  @Input() options: { value: string; label: string }[] = [];

  onSelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newValue = target.value || null;
    this.updateValue(newValue);
  }
}
