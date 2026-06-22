import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFormControl } from '../shared/base-form-control';

/**
 * Textarea form control wrapper.
 *
 * Provides a multi-line text input with consistent styling, validation display,
 * accessibility labels, help text, and character counter for maxLength fields.
 *
 * @requirements 5.1, 5.2, 5.3, 5.10, 17.5
 */
@Component({
  selector: 'app-textarea',
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
        @if (characterCount()) {
          <span class="label-text-alt">{{ characterCount() }}</span>
        }
      </label>

      <!-- Textarea -->
      <textarea
        [id]="controlId"
        class="textarea textarea-bordered w-full"
        [class.textarea-error]="showErrors()"
        [placeholder]="placeholder"
        [disabled]="isDisabled()"
        [rows]="rows"
        [attr.maxlength]="maxLength"
        [attr.aria-describedby]="ariaDescribedBy()"
        [attr.aria-invalid]="ariaInvalid()"
        [attr.aria-disabled]="ariaDisabledAttr()"
        [attr.aria-required]="required || undefined"
        (input)="onInput($event)"
        (blur)="markAsTouched()"
      >{{ value() ?? '' }}</textarea>

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
export class TextareaComponent extends BaseFormControl<string> {
  @Input() rows = 4;

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.updateValue(textarea.value);
  }
}
