import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFormControl } from '../shared/base-form-control';

/**
 * Toggle (switch) form control component.
 *
 * Wraps a DaisyUI toggle input with full ControlValueAccessor integration.
 * Uses a checkbox input styled as a toggle switch.
 *
 * @requirements 5.1, 5.11
 */
@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-control w-full">
      <label class="label cursor-pointer justify-start gap-3" [attr.for]="controlId">
        <input
          type="checkbox"
          class="toggle"
          [id]="controlId"
          [checked]="value() === true"
          [disabled]="isDisabled()"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="ariaInvalid()"
          [attr.aria-disabled]="ariaDisabledAttr()"
          [attr.aria-required]="required || undefined"
          role="switch"
          [attr.aria-checked]="value() === true"
          (change)="onToggleChange($event)"
          (blur)="markAsTouched()"
        />
        <span class="label-text">
          {{ label }}
          @if (required) {
            <span class="text-error" aria-hidden="true">*</span>
          }
        </span>
      </label>

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
export class ToggleComponent extends BaseFormControl<boolean> {
  onToggleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.updateValue(target.checked);
  }
}
