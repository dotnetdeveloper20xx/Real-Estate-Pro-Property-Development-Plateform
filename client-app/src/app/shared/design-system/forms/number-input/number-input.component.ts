import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFormControl } from '../shared/base-form-control';

/**
 * Number input form control wrapper.
 *
 * Provides a numeric input with consistent styling, validation display,
 * accessibility labels, and help text. Emits parsed numeric values.
 *
 * @requirements 5.1, 5.2, 5.3, 17.5
 */
@Component({
  selector: 'app-number-input',
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

      <!-- Input -->
      <input
        type="number"
        [id]="controlId"
        class="input input-bordered w-full"
        [class.input-error]="showErrors()"
        [placeholder]="placeholder"
        [disabled]="isDisabled()"
        [attr.min]="min"
        [attr.max]="max"
        [attr.step]="step"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-invalid]="ariaInvalid()"
        [attr.aria-disabled]="ariaDisabledAttr()"
        [attr.aria-required]="required || undefined"
        [value]="value() ?? ''"
        (input)="onInput($event)"
        (blur)="markAsTouched()"
      />

      <!-- Help Text -->
      @if (helpText) {
        <div class="label" [id]="helpTextId">
          <span class="label-text-alt text-base-content/60">{{ helpText }}</span>
        </div>
      }

      <!-- Error Messages (only shown when touched) -->
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
export class NumberInputComponent extends BaseFormControl<number> {
  @Input() min: number | undefined;
  @Input() max: number | undefined;
  @Input() step: number | string = 'any';

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const parsed = input.value === '' ? null : parseFloat(input.value);
    this.updateValue(parsed !== null && isNaN(parsed) ? null : parsed);
  }
}
