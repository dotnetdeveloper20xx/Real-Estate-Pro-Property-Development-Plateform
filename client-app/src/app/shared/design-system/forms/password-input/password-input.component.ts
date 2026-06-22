import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseFormControl } from '../shared/base-form-control';

/**
 * Password input form control wrapper.
 *
 * Provides a password input with a show/hide toggle, consistent styling,
 * validation display, accessibility labels, and help text.
 *
 * @requirements 5.1, 5.2, 5.3, 17.5
 */
@Component({
  selector: 'app-password-input',
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

      <!-- Input with toggle -->
      <div class="relative">
        <input
          [type]="showPassword() ? 'text' : 'password'"
          [id]="controlId"
          class="input input-bordered w-full pr-12"
          [class.input-error]="showErrors()"
          [placeholder]="placeholder"
          [disabled]="isDisabled()"
          [attr.maxlength]="maxLength"
          [attr.aria-describedby]="ariaDescribedBy()"
          [attr.aria-invalid]="ariaInvalid()"
          [attr.aria-disabled]="ariaDisabledAttr()"
          [attr.aria-required]="required || undefined"
          [value]="value() ?? ''"
          (input)="onInput($event)"
          (blur)="markAsTouched()"
        />
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs"
          [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
          (click)="toggleVisibility()"
          tabindex="-1"
        >
          @if (showPassword()) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        </button>
      </div>

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
export class PasswordInputComponent extends BaseFormControl<string> {
  protected readonly showPassword = signal(false);

  toggleVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.updateValue(input.value);
  }
}
