import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFormControl } from '../shared/base-form-control';

/**
 * Checkbox group form control component.
 *
 * Renders a group of DaisyUI checkboxes for multiple selection.
 * Extends BaseFormControl<string[]> and integrates with Angular Reactive Forms.
 *
 * Uses `role="group"` with `aria-labelledby` for accessibility.
 *
 * @requirements 5.1, 5.11
 */
@Component({
  selector: 'app-checkbox-group',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="form-control w-full">
      <!-- Group Label -->
      <label class="label" [id]="controlId + '-legend'">
        <span class="label-text">
          {{ label }}
          @if (required) {
            <span class="text-error" aria-hidden="true">*</span>
          }
        </span>
      </label>

      <!-- Checkbox Group -->
      <div
        role="group"
        [attr.aria-labelledby]="controlId + '-legend'"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-invalid]="ariaInvalid()"
        [attr.aria-disabled]="ariaDisabledAttr()"
        [attr.aria-required]="required || undefined"
        class="flex flex-col gap-2"
      >
        @for (option of options; track option.value) {
          <label class="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              class="checkbox"
              [id]="controlId + '-' + option.value"
              [checked]="isChecked(option.value)"
              [disabled]="isDisabled()"
              [attr.aria-label]="option.label"
              (change)="onCheckboxChange(option.value, $event)"
              (blur)="markAsTouched()"
            />
            <span class="label-text">{{ option.label }}</span>
          </label>
        }
      </div>

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
export class CheckboxGroupComponent extends BaseFormControl<string[]> {
  @Input() options: { value: string; label: string }[] = [];

  isChecked(optionValue: string): boolean {
    const current = this.value() ?? [];
    return current.includes(optionValue);
  }

  onCheckboxChange(optionValue: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const current = this.value() ?? [];

    const newValue = target.checked
      ? [...current, optionValue]
      : current.filter((v) => v !== optionValue);

    this.updateValue(newValue);
  }
}
